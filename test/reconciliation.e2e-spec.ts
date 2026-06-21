import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { EXTERNAL_ACCOUNT_ID } from '../src/accounts/accounts.constants';
import { AppModule } from '../src/app.module';

describe('Reconciliation (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const openAccount = async (name: string): Promise<string> => {
    const res = await request(app.getHttpServer())
      .post('/accounts')
      .send({ name, currency: 'INR' })
      .expect(201);
    return res.body.id as string;
  };

  const transfer = (
    fromAccountId: string,
    toAccountId: string,
    amountMinor: number,
    idempotencyKey: string,
  ): request.Test =>
    request(app.getHttpServer())
      .post('/transfers')
      .set('Idempotency-Key', idempotencyKey)
      .send({ fromAccountId, toAccountId, amountMinor, currency: 'INR' });

  const fund = (id: string, amountMinor: number): request.Test =>
    transfer(EXTERNAL_ACCOUNT_ID, id, amountMinor, `recon-fund-${id}`);

  const reconcile = () =>
    request(app.getHttpServer()).get('/reconciliation').expect(200);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  it('reports the ledger in balance after real transfers', async () => {
    const a = await openAccount('Recon A');
    const b = await openAccount('Recon B');
    await fund(a, 3000).expect(201);
    await transfer(a, b, 1000, `recon-${a}-pay`).expect(201);

    const res = await reconcile();

    expect(res.body.inBalance).toBe(true);
    expect(res.body.systemBalanced).toBe(true);
    expect(res.body.totalBalanceMinor).toBe(0);

    const driftedIds = res.body.drift.map(
      (d: { accountId: string }) => d.accountId,
    );
    expect(driftedIds).not.toContain(a);
    expect(driftedIds).not.toContain(b);
  });

  it('detects drift when a balance is tampered with, then clears once fixed', async () => {
    const x = await openAccount('Recon drift');
    await fund(x, 2000).expect(201);

    // Simulate corruption: change the recorded balance without a ledger entry.
    await dataSource.query(
      `UPDATE accounts SET balance_minor = balance_minor + 500 WHERE id = $1`,
      [x],
    );

    const bad = await reconcile();
    expect(bad.body.inBalance).toBe(false);
    const entry = bad.body.drift.find(
      (d: { accountId: string }) => d.accountId === x,
    );
    expect(entry).toBeDefined();
    expect(entry.differenceMinor).toBe(500);
    expect(entry.recordedBalanceMinor - entry.computedBalanceMinor).toBe(500);

    // Repair the balance and confirm the drift is gone.
    await dataSource.query(
      `UPDATE accounts SET balance_minor = balance_minor - 500 WHERE id = $1`,
      [x],
    );

    const good = await reconcile();
    const stillDrifted = good.body.drift.find(
      (d: { accountId: string }) => d.accountId === x,
    );
    expect(stillDrifted).toBeUndefined();
  });
});
