import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAccountDto } from './dto/create-account.dto';
import { Account } from './entities/account.entity';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly accounts: Repository<Account>,
  ) {}

  /**
   * Opens a new account. Accounts always start at a zero balance: money only
   * ever enters an account through a balanced transfer, so every balance stays
   * backed by ledger entries.
   */
  async create(dto: CreateAccountDto): Promise<Account> {
    const account = this.accounts.create({
      name: dto.name,
      currency: dto.currency,
      balanceMinor: 0,
    });
    return this.accounts.save(account);
  }

  async findAll(): Promise<Account[]> {
    return this.accounts.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Account> {
    const account = await this.accounts.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException(`Account ${id} not found`);
    }
    return account;
  }
}
