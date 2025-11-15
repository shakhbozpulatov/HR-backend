import { MigrationInterface, QueryRunner } from 'typeorm';

export class NewMigration1763244946442 implements MigrationInterface {
  name = 'NewMigration1763244946442';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add your migration logic here
    // Example:
    // await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "new_column" varchar`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add your rollback logic here
    // Example:
    // await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "new_column"`);
  }
}

