import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AccountsService } from './accounts.service';
import { Account } from './entities/account.entity';

describe('AccountsService', () => {
  let service: AccountsService;
  let repo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
  };

  beforeEach(async () => {
    repo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        { provide: getRepositoryToken(Account), useValue: repo },
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
  });

  it('opens an account with a zero starting balance', async () => {
    const dto = { name: 'Alice wallet', currency: 'INR' };
    const built = { ...dto, balanceMinor: 0 };
    repo.create.mockReturnValue(built);
    repo.save.mockResolvedValue({ id: 'account-uuid', ...built });

    const result = await service.create(dto);

    expect(repo.create).toHaveBeenCalledWith({
      name: 'Alice wallet',
      currency: 'INR',
      balanceMinor: 0,
    });
    expect(result.balanceMinor).toBe(0);
  });

  it('returns the account when it exists', async () => {
    const account = { id: 'account-uuid', name: 'Alice', currency: 'INR' };
    repo.findOne.mockResolvedValue(account);

    await expect(service.findOne('account-uuid')).resolves.toBe(account);
  });

  it('throws NotFound when the account does not exist', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
