import { ApiProperty } from '@nestjs/swagger';
import { EntryDirection, LedgerEntry } from '../entities/ledger-entry.entity';
import { Transfer } from '../entities/transfer.entity';

class LedgerEntryDto {
  @ApiProperty({ format: 'uuid' })
  accountId!: string;

  @ApiProperty({ enum: EntryDirection })
  direction!: EntryDirection;

  @ApiProperty({ example: 5000, description: 'Amount in minor units.' })
  amountMinor!: number;

  static fromEntity(entry: LedgerEntry): LedgerEntryDto {
    const dto = new LedgerEntryDto();
    dto.accountId = entry.accountId;
    dto.direction = entry.direction;
    dto.amountMinor = entry.amountMinor;
    return dto;
  }
}

export class TransferResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'The idempotency key the transfer was created with.' })
  idempotencyKey!: string;

  @ApiProperty({ format: 'uuid', description: 'Debited account.' })
  fromAccountId!: string;

  @ApiProperty({ format: 'uuid', description: 'Credited account.' })
  toAccountId!: string;

  @ApiProperty({ example: 5000, description: 'Amount moved, in minor units.' })
  amountMinor!: number;

  @ApiProperty({ example: 'INR' })
  currency!: string;

  @ApiProperty({ required: false, nullable: true, example: 'Invoice 1024' })
  reference!: string | null;

  @ApiProperty({ type: [LedgerEntryDto] })
  entries!: LedgerEntryDto[];

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  static fromEntity(transfer: Transfer): TransferResponseDto {
    const entries = transfer.entries ?? [];
    const debit = entries.find((e) => e.direction === EntryDirection.DEBIT);
    const credit = entries.find((e) => e.direction === EntryDirection.CREDIT);

    const dto = new TransferResponseDto();
    dto.id = transfer.id;
    dto.idempotencyKey = transfer.idempotencyKey;
    dto.fromAccountId = debit?.accountId ?? '';
    dto.toAccountId = credit?.accountId ?? '';
    dto.amountMinor = transfer.amountMinor;
    dto.currency = transfer.currency;
    dto.reference = transfer.reference;
    dto.entries = entries.map((e) => LedgerEntryDto.fromEntity(e));
    dto.createdAt = transfer.createdAt;
    return dto;
  }
}
