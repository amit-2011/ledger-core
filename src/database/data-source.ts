import 'dotenv/config';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from './typeorm.config';

/**
 * Standalone DataSource used by the TypeORM migration CLI. The NestJS runtime
 * uses the same options through DatabaseModule.
 */
const dataSource = new DataSource(buildDataSourceOptions(process.env));

export default dataSource;
