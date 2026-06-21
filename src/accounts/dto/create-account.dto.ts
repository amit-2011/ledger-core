import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class CreateAccountDto {
  @ApiProperty({
    example: 'Alice wallet',
    maxLength: 120,
    description: 'Human-readable label for the account.',
  })
  @IsString()
  @Length(1, 120)
  name!: string;

  @ApiProperty({
    example: 'INR',
    description: 'ISO 4217 currency code (3 uppercase letters).',
  })
  @Matches(/^[A-Z]{3}$/, {
    message: 'currency must be a 3-letter ISO 4217 code, for example INR',
  })
  currency!: string;
}
