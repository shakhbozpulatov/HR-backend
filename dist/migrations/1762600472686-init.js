"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Init1762600472686 = void 0;
class Init1762600472686 {
    constructor() {
        this.name = 'Init1762600472686';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "users" ADD "hc_person_id" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_f6a406b7c65011e82454c8c7d51" UNIQUE ("hc_person_id")`);
        await queryRunner.query(`ALTER TABLE "schedule_templates" ALTER COLUMN "rounding_min" SET DEFAULT '1'`);
        await queryRunner.query(`ALTER TYPE "public"."users_status_enum" RENAME TO "users_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."users_status_enum" AS ENUM('active', 'inactive', 'synced', 'failed_sync')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "status" TYPE "public"."users_status_enum" USING "status"::"text"::"public"."users_status_enum"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'active'`);
        await queryRunner.query(`DROP TYPE "public"."users_status_enum_old"`);
    }
    async down(queryRunner) {
        await queryRunner.query(`CREATE TYPE "public"."users_status_enum_old" AS ENUM('active', 'inactive')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "status" TYPE "public"."users_status_enum_old" USING "status"::"text"::"public"."users_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'active'`);
        await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."users_status_enum_old" RENAME TO "users_status_enum"`);
        await queryRunner.query(`ALTER TABLE "schedule_templates" ALTER COLUMN "rounding_min" SET DEFAULT '5'`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_f6a406b7c65011e82454c8c7d51"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "hc_person_id"`);
    }
}
exports.Init1762600472686 = Init1762600472686;
//# sourceMappingURL=1762600472686-init.js.map