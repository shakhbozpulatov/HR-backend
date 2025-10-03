"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const schedule_1 = require("@nestjs/schedule");
const bull_1 = require("@nestjs/bull");
const jwt_1 = require("@nestjs/jwt");
const common_module_1 = require("./common/common.module");
const database_config_1 = require("./config/database.config");
const validation_schema_1 = require("./config/validation.schema");
const auth_module_1 = require("./modules/auth/auth.module");
const employees_module_1 = require("./modules/employees/employees.module");
const schedules_module_1 = require("./modules/schedules/schedules.module");
const attendance_module_1 = require("./modules/attendance/attendance.module");
const payroll_module_1 = require("./modules/payroll/payroll.module");
const terminals_module_1 = require("./modules/terminals/terminals.module");
const analytics_module_1 = require("./modules/analytics/analytics.module");
const holidays_module_1 = require("./modules/holidays/holidays.module");
const audit_module_1 = require("./modules/audit/audit.module");
const users_module_1 = require("./modules/users/users.module");
const company_module_1 = require("./modules/company/company.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                validationSchema: validation_schema_1.validationSchema,
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                useClass: database_config_1.DatabaseConfig,
            }),
            schedule_1.ScheduleModule.forRoot(),
            bull_1.BullModule.forRoot({
                redis: {
                    host: process.env.REDIS_HOST || 'localhost',
                    port: parseInt(process.env.REDIS_PORT) || 6379,
                },
            }),
            jwt_1.JwtModule.register({
                global: true,
                secret: process.env.JWT_SECRET || 'default-secret',
                signOptions: { expiresIn: '24h' },
            }),
            auth_module_1.AuthModule,
            employees_module_1.EmployeesModule,
            schedules_module_1.SchedulesModule,
            attendance_module_1.AttendanceModule,
            payroll_module_1.PayrollModule,
            terminals_module_1.TerminalsModule,
            analytics_module_1.AnalyticsModule,
            holidays_module_1.HolidaysModule,
            audit_module_1.AuditModule,
            users_module_1.UsersModule,
            common_module_1.CommonModule,
            company_module_1.CompanyModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map