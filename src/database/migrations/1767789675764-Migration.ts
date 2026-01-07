import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1767789675764 implements MigrationInterface {
    name = 'Migration1767789675764'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7d1634c5e41447831d4869e939" ON "attendance_events" ("user_id", "device_id", "ts_utc") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_7d1634c5e41447831d4869e939"`);
    }

}
