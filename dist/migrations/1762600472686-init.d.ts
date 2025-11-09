import { MigrationInterface, QueryRunner } from "typeorm";
export declare class Init1762600472686 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
