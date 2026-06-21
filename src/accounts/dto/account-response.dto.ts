import { ApiProperty } from '@nestjs/swagger';
import { Account } from '../entities/account.entity';

export class AccountResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Alice wallet' })
  name!: string;

  @ApiProperty({ example: 'INR' })
  currency!: string;

  @ApiProperty({
    example: 0,
    description: 'Current balance in minor units (for example paise).',
  })
  balanceMinor!: number;

  @ApiProperty({
    example: false,
    description:
      'Whether the account may go negative. Only the system external account does.',
  })
  allowNegativeBalance!: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  static fromEntity(account: Account): AccountResponseDto {
    const dto = new AccountResponseDto();
    dto.id = account.id;
    dto.name = account.name;
    dto.currency = account.currency;
    dto.balanceMinor = account.balanceMinor;
    dto.allowNegativeBalance = account.allowNegativeBalance;
    dto.createdAt = account.createdAt;
    return dto;
  }
}
