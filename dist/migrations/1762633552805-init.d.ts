import { MigrationInterface, QueryRunner } from "typeorm";
export declare class Init1762633552805 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
