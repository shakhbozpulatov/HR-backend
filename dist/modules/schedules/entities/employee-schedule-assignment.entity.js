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
exports.EmployeeScheduleAssignment = void 0;
const typeorm_1 = require("typeorm");
const employee_entity_1 = require("../../employees/entities/employee.entity");
const schedule_template_entity_1 = require("./schedule-template.entity");
let EmployeeScheduleAssignment = class EmployeeScheduleAssignment {
};
exports.EmployeeScheduleAssignment = EmployeeScheduleAssignment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], EmployeeScheduleAssignment.prototype, "assignment_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], EmployeeScheduleAssignment.prototype, "employee_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], EmployeeScheduleAssignment.prototype, "default_template_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], EmployeeScheduleAssignment.prototype, "effective_from", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], EmployeeScheduleAssignment.prototype, "effective_to", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Array)
], EmployeeScheduleAssignment.prototype, "exceptions", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], EmployeeScheduleAssignment.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], EmployeeScheduleAssignment.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => employee_entity_1.Employee, (employee) => employee.schedule_assignments),
    (0, typeorm_1.JoinColumn)({ name: 'employee_id' }),
    __metadata("design:type", employee_entity_1.Employee)
], EmployeeScheduleAssignment.prototype, "employee", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => schedule_template_entity_1.ScheduleTemplate, (template) => template.assignments),
    (0, typeorm_1.JoinColumn)({ name: 'default_template_id' }),
    __metadata("design:type", schedule_template_entity_1.ScheduleTemplate)
], EmployeeScheduleAssignment.prototype, "default_template", void 0);
exports.EmployeeScheduleAssignment = EmployeeScheduleAssignment = __decorate([
    (0, typeorm_1.Entity)('employee_schedule_assignments'),
    (0, typeorm_1.Index)(['employee_id', 'effective_from'], { unique: true })
], EmployeeScheduleAssignment);
//# sourceMappingURL=employee-schedule-assignment.entity.js.map