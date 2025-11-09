import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1762633552805 implements MigrationInterface {
    name = 'Init1762633552805'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "photo_url" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "photo_url"`);
    }

}
