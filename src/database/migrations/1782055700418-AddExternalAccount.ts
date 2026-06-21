import { MigrationInterface, QueryRunner } from "typeorm";

export class AddExternalAccount1782055700418 implements MigrationInterface {
    name = 'AddExternalAccount1782055700418'

    // Keep this id in sync with EXTERNAL_ACCOUNT_ID in src/accounts/accounts.constants.ts.
    private readonly externalAccountId = '00000000-0000-4000-8000-000000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "accounts" ADD "allow_negative_balance" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(
            `INSERT INTO "accounts" ("id", "name", "currency", "balance_minor", "allow_negative_balance")
             VALUES ($1, 'External world', 'INR', 0, true)
             ON CONFLICT ("id") DO NOTHING`,
            [this.externalAccountId],
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "accounts" WHERE "id" = $1`, [
            this.externalAccountId,
        ]);
        await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "allow_negative_balance"`);
    }

}
