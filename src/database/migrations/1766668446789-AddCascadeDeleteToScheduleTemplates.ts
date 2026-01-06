import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCascadeDeleteToScheduleTemplates1766668446789 implements MigrationInterface {
    name = 'AddCascadeDeleteToScheduleTemplates1766668446789'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_schedule_assignments" DROP CONSTRAINT "FK_a93f07333c9b5190cf9a181b899"`);
        await queryRunner.query(`ALTER TABLE "terminal_devices" ADD "hc_device_id" character varying`);
        await queryRunner.query(`ALTER TABLE "terminal_devices" ADD CONSTRAINT "UQ_49c52dea294fcfad0f8ee90ce39" UNIQUE ("hc_device_id")`);
        await queryRunner.query(`ALTER TABLE "terminal_devices" ADD "hc_access_level_id" character varying`);
        await queryRunner.query(`ALTER TABLE "terminal_devices" ADD "serial_number" character varying`);
        await queryRunner.query(`ALTER TABLE "terminal_devices" ADD "ip_address" character varying`);
        await queryRunner.query(`ALTER TABLE "terminal_devices" ADD "port" integer`);
        await queryRunner.query(`ALTER TABLE "terminal_devices" ADD "is_hc_synced" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "user_schedule_assignments" ADD CONSTRAINT "FK_a93f07333c9b5190cf9a181b899" FOREIGN KEY ("default_template_id") REFERENCES "schedule_templates"("template_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_schedule_assignments" DROP CONSTRAINT "FK_a93f07333c9b5190cf9a181b899"`);
        await queryRunner.query(`ALTER TABLE "terminal_devices" DROP COLUMN "is_hc_synced"`);
        await queryRunner.query(`ALTER TABLE "terminal_devices" DROP COLUMN "port"`);
        await queryRunner.query(`ALTER TABLE "terminal_devices" DROP COLUMN "ip_address"`);
        await queryRunner.query(`ALTER TABLE "terminal_devices" DROP COLUMN "serial_number"`);
        await queryRunner.query(`ALTER TABLE "terminal_devices" DROP COLUMN "hc_access_level_id"`);
        await queryRunner.query(`ALTER TABLE "terminal_devices" DROP CONSTRAINT "UQ_49c52dea294fcfad0f8ee90ce39"`);
        await queryRunner.query(`ALTER TABLE "terminal_devices" DROP COLUMN "hc_device_id"`);
        await queryRunner.query(`ALTER TABLE "user_schedule_assignments" ADD CONSTRAINT "FK_a93f07333c9b5190cf9a181b899" FOREIGN KEY ("default_template_id") REFERENCES "schedule_templates"("template_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
