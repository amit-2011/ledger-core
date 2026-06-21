import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsUUID,
  Length,
  Matches,
  Min,
} from 'class-validator';

export class CreateTransferDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Account the money moves out of.',
  })
  @IsUUID()
  fromAccountId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Account the money moves into.',
  })
  @IsUUID()
  toAccountId!: string;

  @ApiProperty({
    example: 5000,
    description:
      'Amount to move, in minor units (for example paise). Must be a positive integer.',
  })
  @IsInt()
  @Min(1)
  amountMinor!: number;

  @ApiProperty({
    example: 'INR',
    description:
      'ISO 4217 currency code. Must match both accounts (3 uppercase letters).',
  })
  @Matches(/^[A-Z]{3}$/, {
    message: 'currency must be a 3-letter ISO 4217 code, for example INR',
  })
  currency!: string;

  @ApiProperty({
    required: false,
    example: 'Invoice 1024',
    description: 'Optional free-text note.',
  })
  @IsOptional()
  @Length(1, 255)
  reference?: string;
}
