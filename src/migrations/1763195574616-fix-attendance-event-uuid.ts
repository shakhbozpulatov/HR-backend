import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixAttendanceEventUuid1763195574616 implements MigrationInterface {
  name = 'FixAttendanceEventUuid1763195574616';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "attendance_events" DROP CONSTRAINT "FK_5416a2812d4a465e3f2777f62ae"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance_events" DROP CONSTRAINT "FK_4955938be91f3cb485f7f4ce082"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b039ccb5e7f013a72042f5087a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4e40a0733c11fc2ca214787eb3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c5921af73d530cf4cddb2d3edd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance_events" DROP COLUMN "user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance_events" ADD "user_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance_events" DROP COLUMN "device_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance_events" ADD "device_id" character varying NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c5921af73d530cf4cddb2d3edd" ON "attendance_events" ("terminal_user_id", "device_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4e40a0733c11fc2ca214787eb3" ON "attendance_events" ("device_id", "ts_local") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b039ccb5e7f013a72042f5087a" ON "attendance_events" ("user_id", "ts_local") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b039ccb5e7f013a72042f5087a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4e40a0733c11fc2ca214787eb3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c5921af73d530cf4cddb2d3edd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance_events" DROP COLUMN "device_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance_events" ADD "device_id" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance_events" DROP COLUMN "user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance_events" ADD "user_id" uuid`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c5921af73d530cf4cddb2d3edd" ON "attendance_events" ("terminal_user_id", "device_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4e40a0733c11fc2ca214787eb3" ON "attendance_events" ("device_id", "ts_local") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b039ccb5e7f013a72042f5087a" ON "attendance_events" ("user_id", "ts_local") `,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance_events" ADD CONSTRAINT "FK_4955938be91f3cb485f7f4ce082" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance_events" ADD CONSTRAINT "FK_5416a2812d4a465e3f2777f62ae" FOREIGN KEY ("device_id") REFERENCES "terminal_devices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
