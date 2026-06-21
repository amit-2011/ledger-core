/**
 * The system "External world" account. It represents money entering or leaving
 * the closed ledger: a deposit is a transfer from this account to a user
 * account, a withdrawal is the reverse. It is the only account allowed to hold
 * a negative balance, which keeps the sum of all account balances at zero.
 *
 * Seeded with this fixed id by the AddExternalAccount migration. It is a valid
 * v4 UUID so it passes the same UUID validation as any other account id.
 */
export const EXTERNAL_ACCOUNT_ID = '00000000-0000-4000-8000-000000000000';
