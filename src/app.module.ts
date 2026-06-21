import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AccountsModule } from './accounts/accounts.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { TransfersModule } from './ledger/transfers.module';
import { ReconciliationModule } from './reconciliation/reconciliation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    HealthModule,
    AccountsModule,
    TransfersModule,
    ReconciliationModule,
  ],
})
export class AppModule {}
