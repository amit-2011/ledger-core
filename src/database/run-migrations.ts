import dataSource from './data-source';

/**
 * Applies any pending migrations and exits. Run on deploy, before the app
 * starts, so the schema is always up to date with the code.
 */
async function runMigrations(): Promise<void> {
  await dataSource.initialize();
  try {
    const migrations = await dataSource.runMigrations();
    if (migrations.length === 0) {
      console.log('Database is up to date, no migrations to run.');
    } else {
      const names = migrations.map((migration) => migration.name).join(', ');
      console.log(`Ran ${migrations.length} migration(s): ${names}`);
    }
  } finally {
    await dataSource.destroy();
  }
}

runMigrations().catch((error: unknown) => {
  console.error('Migration run failed:', error);
  process.exit(1);
});
