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
exports.UserScheduleAssignment = void 0;
const typeorm_1 = require("typeorm");
const schedule_template_entity_1 = require("./schedule-template.entity");
const user_entity_1 = require("../../users/entities/user.entity");
let UserScheduleAssignment = class UserScheduleAssignment {
};
exports.UserScheduleAssignment = UserScheduleAssignment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], UserScheduleAssignment.prototype, "assignment_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], UserScheduleAssignment.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], UserScheduleAssignment.prototype, "default_template_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], UserScheduleAssignment.prototype, "effective_from", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], UserScheduleAssignment.prototype, "effective_to", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Array)
], UserScheduleAssignment.prototype, "exceptions", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], UserScheduleAssignment.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], UserScheduleAssignment.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.schedule_assignments),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], UserScheduleAssignment.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => schedule_template_entity_1.ScheduleTemplate, (template) => template.assignments),
    (0, typeorm_1.JoinColumn)({ name: 'default_template_id' }),
    __metadata("design:type", schedule_template_entity_1.ScheduleTemplate)
], UserScheduleAssignment.prototype, "default_template", void 0);
exports.UserScheduleAssignment = UserScheduleAssignment = __decorate([
    (0, typeorm_1.Entity)('user_schedule_assignments'),
    (0, typeorm_1.Index)(['user_id', 'effective_from'], { unique: true })
], UserScheduleAssignment);
//# sourceMappingURL=employee-schedule-assignment.entity.js.map