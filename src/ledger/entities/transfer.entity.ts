import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { bigIntTransformer } from '../../common/transformers/bigint.transformer';
import { LedgerEntry } from './ledger-entry.entity';

/**
 * A posted transfer: the header of a balanced double-entry transaction.
 * `idempotencyKey` is unique, so retrying the same request never applies the
 * transfer twice. `amountMinor` is the moved amount and equals the sum of the
 * transfer's debit entries.
 */
@Entity('transfers')
export class Transfer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ name: 'idempotency_key', type: 'varchar', length: 200 })
  idempotencyKey!: string;

  @Column({ type: 'char', length: 3 })
  currency!: string;

  @Column({
    name: 'amount_minor',
    type: 'bigint',
    transformer: bigIntTransformer,
  })
  amountMinor!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reference!: string | null;

  @OneToMany(() => LedgerEntry, (entry) => entry.transfer, {
    cascade: true,
  })
  entries!: LedgerEntry[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
