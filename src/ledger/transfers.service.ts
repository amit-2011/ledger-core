import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, QueryFailedError, Repository } from 'typeorm';
import { Account } from '../accounts/entities/account.entity';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { EntryDirection, LedgerEntry } from './entities/ledger-entry.entity';
import { Transfer } from './entities/transfer.entity';

const PG_UNIQUE_VIOLATION = '23505';

function isUniqueViolation(error: unknown): boolean {
  if (!(error instanceof QueryFailedError)) {
    return false;
  }
  const driverError = error.driverError as { code?: string };
  return driverError?.code === PG_UNIQUE_VIOLATION;
}

@Injectable()
export class TransfersService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(Transfer)
    private readonly transfers: Repository<Transfer>,
  ) {}

  /**
   * Posts a balanced double-entry transfer from one account to another.
   *
   * Guarantees:
   * - Idempotent: a repeated request with the same idempotency key returns the
   *   original transfer and never moves money twice.
   * - Atomic: both ledger entries and both balance updates commit together, or
   *   nothing does.
   * - Concurrency-safe: the affected account rows are locked FOR UPDATE, so two
   *   transfers touching the same account cannot corrupt its balance.
   */
  async create(
    dto: CreateTransferDto,
    idempotencyKey: string,
  ): Promise<Transfer> {
    if (dto.fromAccountId === dto.toAccountId) {
      throw new BadRequestException(
        'fromAccountId and toAccountId must be different',
      );
    }

    // Fast path: this transfer was already applied under the same key.
    const replay = await this.findByIdempotencyKey(idempotencyKey);
    if (replay) {
      return replay;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // Lock both account rows for the duration of the transaction. A single
      // IN (...) FOR UPDATE locks rows in a deterministic scan order, so
      // concurrent transfers over the same pair cannot deadlock.
      const accounts = await queryRunner.manager.find(Account, {
        where: { id: In([dto.fromAccountId, dto.toAccountId]) },
        lock: { mode: 'pessimistic_write' },
      });
      const from = accounts.find((a) => a.id === dto.fromAccountId);
      const to = accounts.find((a) => a.id === dto.toAccountId);

      if (!from) {
        throw new NotFoundException(`Account ${dto.fromAccountId} not found`);
      }
      if (!to) {
        throw new NotFoundException(`Account ${dto.toAccountId} not found`);
      }
      if (from.currency !== dto.currency || to.currency !== dto.currency) {
        throw new BadRequestException(
          'currency must match both the source and destination account',
        );
      }

      const newFromBalance = from.balanceMinor - dto.amountMinor;
      if (!from.allowNegativeBalance && newFromBalance < 0) {
        throw new UnprocessableEntityException(
          'insufficient funds in the source account',
        );
      }

      from.balanceMinor = newFromBalance;
      to.balanceMinor = to.balanceMinor + dto.amountMinor;
      await queryRunner.manager.save([from, to]);

      const transfer = queryRunner.manager.create(Transfer, {
        idempotencyKey,
        currency: dto.currency,
        amountMinor: dto.amountMinor,
        reference: dto.reference ?? null,
        entries: [
          queryRunner.manager.create(LedgerEntry, {
            accountId: from.id,
            direction: EntryDirection.DEBIT,
            amountMinor: dto.amountMinor,
          }),
          queryRunner.manager.create(LedgerEntry, {
            accountId: to.id,
            direction: EntryDirection.CREDIT,
            amountMinor: dto.amountMinor,
          }),
        ],
      });
      const saved = await queryRunner.manager.save(transfer);

      await queryRunner.commitTransaction();
      return saved;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      // Another concurrent request won the race on the same idempotency key.
      // Return its result instead of surfacing the unique-constraint error.
      if (isUniqueViolation(error)) {
        const existing = await this.findByIdempotencyKey(idempotencyKey);
        if (existing) {
          return existing;
        }
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findOne(id: string): Promise<Transfer> {
    const transfer = await this.transfers.findOne({
      where: { id },
      relations: { entries: true },
    });
    if (!transfer) {
      throw new NotFoundException(`Transfer ${id} not found`);
    }
    return transfer;
  }

  private async findByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<Transfer | null> {
    return this.transfers.findOne({
      where: { idempotencyKey },
      relations: { entries: true },
    });
  }
}
