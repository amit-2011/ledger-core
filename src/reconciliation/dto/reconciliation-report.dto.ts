import { ApiProperty } from '@nestjs/swagger';

export class AccountDriftDto {
  @ApiProperty({ format: 'uuid' })
  accountId!: string;

  @ApiProperty({
    example: 6000,
    description: 'Balance currently recorded on the account.',
  })
  recordedBalanceMinor!: number;

  @ApiProperty({
    example: 5500,
    description: 'Balance implied by summing the account ledger entries.',
  })
  computedBalanceMinor!: number;

  @ApiProperty({
    example: 500,
    description: 'recordedBalanceMinor minus computedBalanceMinor.',
  })
  differenceMinor!: number;
}

export class ReconciliationReportDto {
  @ApiProperty({ type: String, format: 'date-time' })
  checkedAt!: string;

  @ApiProperty({ example: 12 })
  accountsChecked!: number;

  @ApiProperty({
    example: true,
    description: 'True when no account has drifted from its ledger entries.',
  })
  inBalance!: boolean;

  @ApiProperty({
    example: 0,
    description:
      'Sum of every account balance. In a closed ledger this is always 0.',
  })
  totalBalanceMinor!: number;

  @ApiProperty({
    example: true,
    description: 'True when totalBalanceMinor is 0.',
  })
  systemBalanced!: boolean;

  @ApiProperty({
    type: [AccountDriftDto],
    description: 'Accounts whose recorded balance does not match their entries.',
  })
  drift!: AccountDriftDto[];
}
