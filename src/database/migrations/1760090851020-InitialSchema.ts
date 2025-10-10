import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1760090851020 implements MigrationInterface {
  name = 'InitialSchema1760090851020';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async up(_queryRunner: QueryRunner): Promise<void> {
    // Database schema already exists from synchronize mode
    // This migration serves as a baseline for future migrations
    // All tables were created via TypeORM synchronize: true
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all tables in reverse order to respect foreign key constraints
    await queryRunner.query(
      `DROP TABLE IF EXISTS "attendance_processing_logs" CASCADE`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "user_device_mappings" CASCADE`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs" CASCADE`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS "work_volume_entries" CASCADE`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "payroll_items" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payroll_periods" CASCADE`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS "attendance_records" CASCADE`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "attendance_events" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "terminal_devices" CASCADE`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS "user_schedule_assignments" CASCADE`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "schedule_templates" CASCADE`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "holidays" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "departments" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "companies" CASCADE`);

    // Drop enums
    await queryRunner.query(
      `DROP TYPE IF EXISTS "attendance_processing_logs_processing_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "companies_subscription_plan_enum"`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "companies_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_role_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_tariff_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_status_enum"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "payroll_periods_status_enum"`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "payroll_items_source_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "payroll_items_code_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "payroll_items_type_enum"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "terminal_devices_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "attendance_events_processing_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "attendance_events_event_source_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "attendance_events_event_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "user_device_mappings_enrollment_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "attendance_records_status_enum"`,
    );
  }
}
