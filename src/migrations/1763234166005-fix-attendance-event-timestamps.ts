import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixAttendanceEventTimestamps1763234166005
  implements MigrationInterface
{
  name = 'FixAttendanceEventTimestamps1763234166005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_aed57a7bf0be55d5b9e5793c4c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance_events" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance_events" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance_events" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance_events" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_aed57a7bf0be55d5b9e5793c4c" ON "attendance_events" ("processing_status", "created_at") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_aed57a7bf0be55d5b9e5793c4c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance_events" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance_events" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance_events" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance_events" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_aed57a7bf0be55d5b9e5793c4c" ON "attendance_events" ("created_at", "processing_status") `,
    );
  }
}
