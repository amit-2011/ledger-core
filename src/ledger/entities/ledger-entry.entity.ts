import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';
import { bigIntTransformer } from '../../common/transformers/bigint.transformer';
import { Transfer } from './transfer.entity';

export enum EntryDirection {
  DEBIT = 'debit',
  CREDIT = 'credit',
}

/**
 * One leg of a double-entry transfer. Every transfer has at least two entries
 * whose debits and credits balance (sum of debits == sum of credits). An
 * account's signed contribution is +amount for a credit and -amount for a
 * debit, which is how its running balance is derived.
 */
@Entity('ledger_entries')
export class LedgerEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'transfer_id', type: 'uuid' })
  transferId!: string;

  @ManyToOne(() => Transfer, (transfer) => transfer.entries, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'transfer_id' })
  transfer!: Transfer;

  @Column({ name: 'account_id', type: 'uuid' })
  accountId!: string;

  @ManyToOne(() => Account, (account) => account.entries, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'account_id' })
  account!: Account;

  @Column({ type: 'enum', enum: EntryDirection })
  direction!: EntryDirection;

  @Column({
    name: 'amount_minor',
    type: 'bigint',
    transformer: bigIntTransformer,
  })
  amountMinor!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
