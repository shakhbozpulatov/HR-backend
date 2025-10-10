import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class InitialSchema1760090851020 implements MigrationInterface {
    name: string;
    up(_queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
