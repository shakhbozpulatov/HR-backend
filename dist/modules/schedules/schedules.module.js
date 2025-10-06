"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const schedule_templates_controller_1 = require("./schedule-templates.controller");
const schedule_assignments_controller_1 = require("./schedule-assignments.controller");
const schedule_templates_service_1 = require("./schedule-templates.service");
const schedule_assignments_service_1 = require("./schedule-assignments.service");
const schedule_template_entity_1 = require("./entities/schedule-template.entity");
const employee_schedule_assignment_entity_1 = require("./entities/employee-schedule-assignment.entity");
const user_entity_1 = require("../users/entities/user.entity");
const users_module_1 = require("../users/users.module");
let SchedulesModule = class SchedulesModule {
};
exports.SchedulesModule = SchedulesModule;
exports.SchedulesModule = SchedulesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([schedule_template_entity_1.ScheduleTemplate, employee_schedule_assignment_entity_1.UserScheduleAssignment, user_entity_1.User]),
            users_module_1.UsersModule,
        ],
        controllers: [schedule_templates_controller_1.ScheduleTemplatesController, schedule_assignments_controller_1.ScheduleAssignmentsController],
        providers: [schedule_templates_service_1.ScheduleTemplatesService, schedule_assignments_service_1.ScheduleAssignmentsService],
        exports: [schedule_templates_service_1.ScheduleTemplatesService, schedule_assignments_service_1.ScheduleAssignmentsService],
    })
], SchedulesModule);
//# sourceMappingURL=schedules.module.js.map