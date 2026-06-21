import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { EXTERNAL_ACCOUNT_ID } from '../src/accounts/accounts.constants';
import { AppModule } from '../src/app.module';

describe('Transfers (e2e)', () => {
  let app: INestApplication;

  const openAccount = async (name: string): Promise<string> => {
    const res = await request(app.getHttpServer())
      .post('/accounts')
      .send({ name, currency: 'INR' })
      .expect(201);
    return res.body.id as string;
  };

  const balanceOf = async (id: string): Promise<number> => {
    const res = await request(app.getHttpServer())
      .get(`/accounts/${id}`)
      .expect(200);
    return res.body.balanceMinor as number;
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

  // Deposit money into an account from the system external account.
  const fund = (id: string, amountMinor: number): request.Test =>
    transfer(EXTERNAL_ACCOUNT_ID, id, amountMinor, `fund-${id}`);

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
    // Listen on a real ephemeral port so the concurrency test can fire many
    // requests at one shared server instead of re-binding per request.
    await app.listen(0);
  });

  afterAll(async () => {
    await app.close();
  });

  it('moves money and records a balanced double-entry', async () => {
    const alice = await openAccount('Alice');
    const bob = await openAccount('Bob');
    await fund(alice, 10000).expect(201);

    const res = await transfer(alice, bob, 4000, `t-${alice}-pay`).expect(201);

    expect(res.body.fromAccountId).toBe(alice);
    expect(res.body.toAccountId).toBe(bob);
    expect(res.body.amountMinor).toBe(4000);

    const debits = res.body.entries
      .filter((e: { direction: string }) => e.direction === 'debit')
      .reduce((sum: number, e: { amountMinor: number }) => sum + e.amountMinor, 0);
    const credits = res.body.entries
      .filter((e: { direction: string }) => e.direction === 'credit')
      .reduce((sum: number, e: { amountMinor: number }) => sum + e.amountMinor, 0);
    expect(debits).toBe(credits);

    expect(await balanceOf(alice)).toBe(6000);
    expect(await balanceOf(bob)).toBe(4000);
  });

  it('applies a repeated idempotency key exactly once', async () => {
    const alice = await openAccount('Alice idem');
    const bob = await openAccount('Bob idem');
    await fund(alice, 5000).expect(201);

    const key = `t-${alice}-once`;
    const first = await transfer(alice, bob, 2000, key).expect(201);
    const second = await transfer(alice, bob, 2000, key).expect(201);

    expect(second.body.id).toBe(first.body.id);
    expect(await balanceOf(alice)).toBe(3000);
    expect(await balanceOf(bob)).toBe(2000);
  });

  it('rejects a transfer with insufficient funds and changes nothing', async () => {
    const alice = await openAccount('Alice broke');
    const bob = await openAccount('Bob rich');
    await fund(alice, 1000).expect(201);

    await transfer(alice, bob, 5000, `t-${alice}-over`).expect(422);

    expect(await balanceOf(alice)).toBe(1000);
    expect(await balanceOf(bob)).toBe(0);
  });

  it('rejects a transfer to the same account', async () => {
    const alice = await openAccount('Alice self');
    await fund(alice, 1000).expect(201);
    await transfer(alice, alice, 100, `t-${alice}-self`).expect(400);
  });

  it('requires an Idempotency-Key header', async () => {
    const alice = await openAccount('Alice nokey');
    const bob = await openAccount('Bob nokey');
    await request(app.getHttpServer())
      .post('/transfers')
      .send({
        fromAccountId: alice,
        toAccountId: bob,
        amountMinor: 100,
        currency: 'INR',
      })
      .expect(400);
  });

  it('rejects a non-positive amount', async () => {
    const alice = await openAccount('Alice zero');
    const bob = await openAccount('Bob zero');
    await transfer(alice, bob, 0, `t-${alice}-zero`).expect(400);
  });

  it('never overdraws under concurrent transfers', async () => {
    const alice = await openAccount('Alice race');
    const bob = await openAccount('Bob race');
    await fund(alice, 1000).expect(201);

    // 20 concurrent transfers of 100 against a balance of 1000: only 10 can win.
    const attempts = Array.from({ length: 20 }, (_, i) =>
      transfer(alice, bob, 100, `t-${alice}-race-${i}`),
    );
    const results = await Promise.all(
      attempts.map((req) => req.then((res) => res.status)),
    );

    const succeeded = results.filter((status) => status === 201).length;
    const rejected = results.filter((status) => status === 422).length;

    expect(succeeded).toBe(10);
    expect(rejected).toBe(10);
    expect(await balanceOf(alice)).toBe(0);
    expect(await balanceOf(bob)).toBe(1000);
  });
});
