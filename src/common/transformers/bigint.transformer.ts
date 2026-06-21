import { ValueTransformer } from 'typeorm';

/**
 * Money is held in the database as a bigint column (minor units, e.g. paise),
 * but exposed to the application as a plain JS integer. Amounts are validated
 * as safe integers at the DTO boundary, so this conversion never loses
 * precision in practice. Never store money as a float.
 */
export class BigIntTransformer implements ValueTransformer {
  to(value: number | null | undefined): string | null {
    if (value === null || value === undefined) {
      return null;
    }
    return value.toString();
  }

  from(value: string | null | undefined): number | null {
    if (value === null || value === undefined) {
      return null;
    }
    return Number(value);
  }
}

export const bigIntTransformer = new BigIntTransformer();
