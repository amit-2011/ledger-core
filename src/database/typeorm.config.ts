import { join } from 'path';
import { DataSourceOptions } from 'typeorm';

/**
 * Builds the TypeORM connection options from the environment. Shared by the
 * NestJS runtime (DatabaseModule) and the migration CLI (data-source.ts) so
 * both always use exactly the same configuration.
 */
export function buildDataSourceOptions(
  env: NodeJS.ProcessEnv,
): DataSourceOptions {
  return {
    type: 'postgres',
    host: env.DB_HOST ?? 'localhost',
    port: Number(env.DB_PORT ?? '5432'),
    username: env.DB_USERNAME ?? 'ledger',
    password: env.DB_PASSWORD ?? 'ledger',
    database: env.DB_NAME ?? 'ledger_core',
    entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
    migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
    // Schema changes go through explicit migrations, never auto-sync.
    synchronize: false,
    migrationsRun: false,
    logging: env.DB_LOGGING === 'true',
  };
}
