import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1782051137405 implements MigrationInterface {
    name = 'InitSchema1782051137405'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE TABLE "accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(120) NOT NULL, "currency" character(3) NOT NULL, "balance_minor" bigint NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_5a7a02c20412299d198e097a8fe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."ledger_entries_direction_enum" AS ENUM('debit', 'credit')`);
        await queryRunner.query(`CREATE TABLE "ledger_entries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "transfer_id" uuid NOT NULL, "account_id" uuid NOT NULL, "direction" "public"."ledger_entries_direction_enum" NOT NULL, "amount_minor" bigint NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_6efcb84411d3f08b08450ae75d5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "transfers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "idempotency_key" character varying(200) NOT NULL, "currency" character(3) NOT NULL, "amount_minor" bigint NOT NULL, "reference" character varying(255), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_f712e908b465e0085b4408cabc3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_49061dae56a8d231067a8446a4" ON "transfers" ("idempotency_key") `);
        await queryRunner.query(`ALTER TABLE "ledger_entries" ADD CONSTRAINT "FK_4c4e51a18457825d953ecc80a86" FOREIGN KEY ("transfer_id") REFERENCES "transfers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ledger_entries" ADD CONSTRAINT "FK_e4440167e470be69f9622c1ceab" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ledger_entries" DROP CONSTRAINT "FK_e4440167e470be69f9622c1ceab"`);
        await queryRunner.query(`ALTER TABLE "ledger_entries" DROP CONSTRAINT "FK_4c4e51a18457825d953ecc80a86"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_49061dae56a8d231067a8446a4"`);
        await queryRunner.query(`DROP TABLE "transfers"`);
        await queryRunner.query(`DROP TABLE "ledger_entries"`);
        await queryRunner.query(`DROP TYPE "public"."ledger_entries_direction_enum"`);
        await queryRunner.query(`DROP TABLE "accounts"`);
    }

}
