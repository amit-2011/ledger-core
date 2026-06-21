import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { bigIntTransformer } from '../../common/transformers/bigint.transformer';
import { LedgerEntry } from '../../ledger/entities/ledger-entry.entity';

/**
 * A money account. `balanceMinor` is a running balance in minor units that is
 * kept in sync with the account's ledger entries inside each transfer's
 * transaction. Reconciliation verifies balanceMinor == sum of the account's
 * signed ledger entries.
 */
@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'char', length: 3 })
  currency!: string;

  @Column({
    name: 'balance_minor',
    type: 'bigint',
    default: 0,
    transformer: bigIntTransformer,
  })
  balanceMinor!: number;

  /**
   * Whether this account may hold a negative balance. Only the system
   * "External world" account sets this, so deposits and withdrawals stay
   * balanced double-entry transfers while ordinary accounts can never overdraw.
   */
  @Column({ name: 'allow_negative_balance', type: 'boolean', default: false })
  allowNegativeBalance!: boolean;

  @OneToMany(() => LedgerEntry, (entry) => entry.account)
  entries!: LedgerEntry[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
