import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Accounts (e2e)', () => {
  let app: INestApplication;

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
  });

  afterAll(async () => {
    await app.close();
  });

  it('opens an account with a zero balance and reads it back', async () => {
    const created = await request(app.getHttpServer())
      .post('/accounts')
      .send({ name: 'Alice wallet', currency: 'INR' })
      .expect(201);

    expect(created.body.id).toEqual(expect.any(String));
    expect(created.body.name).toBe('Alice wallet');
    expect(created.body.currency).toBe('INR');
    expect(created.body.balanceMinor).toBe(0);

    const fetched = await request(app.getHttpServer())
      .get(`/accounts/${created.body.id}`)
      .expect(200);

    expect(fetched.body.id).toBe(created.body.id);
    expect(fetched.body.balanceMinor).toBe(0);
  });

  it('rejects an invalid currency code', async () => {
    await request(app.getHttpServer())
      .post('/accounts')
      .send({ name: 'Bad currency', currency: 'rupee' })
      .expect(400);
  });

  it('rejects unknown fields', async () => {
    await request(app.getHttpServer())
      .post('/accounts')
      .send({ name: 'Sneaky', currency: 'INR', balanceMinor: 999999 })
      .expect(400);
  });

  it('returns 400 for a non-uuid id', async () => {
    await request(app.getHttpServer()).get('/accounts/not-a-uuid').expect(400);
  });

  it('returns 404 for a missing account', async () => {
    await request(app.getHttpServer())
      .get('/accounts/00000000-0000-0000-0000-000000000000')
      .expect(404);
  });
});
