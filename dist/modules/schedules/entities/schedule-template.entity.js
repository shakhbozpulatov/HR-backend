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
exports.ScheduleTemplate = void 0;
const typeorm_1 = require("typeorm");
const employee_schedule_assignment_entity_1 = require("./employee-schedule-assignment.entity");
let ScheduleTemplate = class ScheduleTemplate {
};
exports.ScheduleTemplate = ScheduleTemplate;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ScheduleTemplate.prototype, "template_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ScheduleTemplate.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json' }),
    __metadata("design:type", Array)
], ScheduleTemplate.prototype, "workdays", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time' }),
    __metadata("design:type", String)
], ScheduleTemplate.prototype, "start_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time' }),
    __metadata("design:type", String)
], ScheduleTemplate.prototype, "end_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Array)
], ScheduleTemplate.prototype, "breaks", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 5 }),
    __metadata("design:type", Number)
], ScheduleTemplate.prototype, "grace_in_min", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], ScheduleTemplate.prototype, "grace_out_min", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 5 }),
    __metadata("design:type", Number)
], ScheduleTemplate.prototype, "rounding_min", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ScheduleTemplate.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ScheduleTemplate.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => employee_schedule_assignment_entity_1.EmployeeScheduleAssignment, (assignment) => assignment.default_template),
    __metadata("design:type", Array)
], ScheduleTemplate.prototype, "assignments", void 0);
exports.ScheduleTemplate = ScheduleTemplate = __decorate([
    (0, typeorm_1.Entity)('schedule_templates')
], ScheduleTemplate);
//# sourceMappingURL=schedule-template.entity.js.map