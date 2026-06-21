import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  AccountDriftDto,
  ReconciliationReportDto,
} from './dto/reconciliation-report.dto';

interface RawReconciliationRow {
  accountId: string;
  recorded: string;
  computed: string;
}

@Injectable()
export class ReconciliationService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /**
   * Recomputes every account balance from its ledger entries and compares it to
   * the recorded balance. A credit contributes +amount and a debit -amount, so
   * a healthy account always has recorded == computed. Any mismatch is drift,
   * which is exactly what reconciliation exists to catch.
   */
  async reconcile(): Promise<ReconciliationReportDto> {
    const rows: RawReconciliationRow[] = await this.dataSource.query(
      `SELECT a.id AS "accountId",
              a.balance_minor AS "recorded",
              COALESCE(
                SUM(
                  CASE WHEN le.direction = 'credit'
                       THEN le.amount_minor
                       ELSE -le.amount_minor END
                ), 0
              ) AS "computed"
       FROM accounts a
       LEFT JOIN ledger_entries le ON le.account_id = a.id
       GROUP BY a.id, a.balance_minor`,
    );

    const drift: AccountDriftDto[] = [];
    let totalBalanceMinor = 0;

    for (const row of rows) {
      const recorded = Number(row.recorded);
      const computed = Number(row.computed);
      totalBalanceMinor += recorded;

      if (recorded !== computed) {
        drift.push({
          accountId: row.accountId,
          recordedBalanceMinor: recorded,
          computedBalanceMinor: computed,
          differenceMinor: recorded - computed,
        });
      }
    }

    return {
      checkedAt: new Date().toISOString(),
      accountsChecked: rows.length,
      inBalance: drift.length === 0,
      totalBalanceMinor,
      systemBalanced: totalBalanceMinor === 0,
      drift,
    };
  }
}
