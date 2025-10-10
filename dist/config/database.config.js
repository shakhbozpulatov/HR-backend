"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataSourceOptions = exports.DatabaseConfig = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("typeorm");
const dotenv = require("dotenv");
dotenv.config();
let DatabaseConfig = class DatabaseConfig {
    constructor(configService) {
        this.configService = configService;
    }
    createTypeOrmOptions() {
        const isProd = this.configService.get('NODE_ENV') === 'production';
        return {
            type: 'postgres',
            host: this.configService.get('DB_HOST', 'localhost'),
            port: this.configService.get('DB_PORT', 5432),
            username: this.configService.get('DB_USERNAME', 'postgres'),
            password: this.configService.get('DB_PASSWORD', 'sh1207200'),
            database: this.configService.get('DB_NAME', 'hr_backend'),
            entities: isProd
                ? [__dirname + '/../**/*.entity.js']
                : [__dirname + '/../**/*.entity.ts'],
            migrations: isProd
                ? [__dirname + '/../migrations/*.js']
                : [__dirname + '/../migrations/*.ts'],
            synchronize: false,
            logging: !isProd,
            ssl: isProd ? { rejectUnauthorized: false } : false,
        };
    }
};
exports.DatabaseConfig = DatabaseConfig;
exports.DatabaseConfig = DatabaseConfig = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], DatabaseConfig);
const isProd = process.env.NODE_ENV === 'production';
exports.dataSourceOptions = {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'sh1207200',
    database: process.env.DB_NAME || 'hr_backend',
    entities: isProd ? ['dist/**/*.entity.js'] : ['src/**/*.entity.ts'],
    migrations: isProd ? ['dist/migrations/*.js'] : ['src/migrations/*.ts'],
    synchronize: false,
    logging: !isProd,
    ssl: isProd ? { rejectUnauthorized: false } : false,
};
const dataSource = new typeorm_1.DataSource(exports.dataSourceOptions);
exports.default = dataSource;
//# sourceMappingURL=database.config.js.map