import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [HealthService],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('reports an ok status', () => {
    const result = controller.check();
    expect(result.status).toBe('ok');
  });

  it('returns a valid ISO timestamp', () => {
    const result = controller.check();
    expect(Number.isNaN(Date.parse(result.timestamp))).toBe(false);
  });

  it('returns a non-negative uptime', () => {
    const result = controller.check();
    expect(result.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });
});
