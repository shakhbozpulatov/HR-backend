import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';

// Load env for CLI (typeorm commands)
dotenv.config();

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const isProd = this.configService.get('NODE_ENV') === 'production';

    return {
      type: 'postgres',
      host: this.configService.get('DB_HOST', 'localhost'),
      port: this.configService.get('DB_PORT', 5432),
      username: this.configService.get('DB_USERNAME', 'postgres'),
      password: this.configService.get('DB_PASSWORD', 'sh1207200'),
      database: this.configService.get('DB_NAME', 'hr_backend'),

      // 🧠 Entities - use autoLoadEntities for dev
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      autoLoadEntities: true,

      // 🧱 Migrations (different for prod/dev)
      migrations: isProd
        ? [__dirname + '/../database/migrations/*.js']
        : [__dirname + '/../database/migrations/*.ts'],

      synchronize: false, // never true in production
      logging: !isProd,
      ssl: isProd ? { rejectUnauthorized: false } : false,
    };
  }
}

// 🧩 CLI uchun (migration:generate, migration:run)
const isProd = process.env.NODE_ENV === 'production';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'sh1207200',
  database: process.env.DB_NAME || 'hr_backend',

  // ⚙️ CLI uchun to‘g‘ri yo‘llar
  entities: isProd ? ['dist/**/*.entity.js'] : ['src/**/*.entity.ts'],

  migrations: isProd
    ? ['dist/database/migrations/*.js']
    : ['src/database/migrations/*.ts'],

  synchronize: false,
  logging: !isProd,
  ssl: isProd ? { rejectUnauthorized: false } : false,
};

// Export DataSource instance for TypeORM CLI
const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
