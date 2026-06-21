# ledger-core

A reliable double-entry ledger / payments-core service, built in NestJS + TypeScript + PostgreSQL.

It demonstrates the boring-but-hard parts of moving money correctly:

- Money as integers: amounts stored in minor units (paise/cents), never floats.
- Idempotency keys: the same write request never applies a transfer twice.
- Double-entry ledger: every transaction is balanced (sum of debits == sum of credits).
- Atomic transfers: each transfer is a single DB transaction, with no partial state.
- Reconciliation: verify sum of entries == account balances and surface any drift.
- Concurrency-safe: row-level locking (SELECT ... FOR UPDATE) prevents race conditions.

## Status

Early development.

## Branching model

| Branch      | Purpose                                          |
| ----------- | ------------------------------------------------ |
| main        | Production-ready, released code.                 |
| uat         | User-acceptance / staging.                        |
| development | Active development; feature branches merge here. |

All three branches are protected. Changes land via pull request, with no direct pushes.

## Tech

NestJS, TypeScript (strict), PostgreSQL, Jest, Swagger/OpenAPI, Docker Compose.
