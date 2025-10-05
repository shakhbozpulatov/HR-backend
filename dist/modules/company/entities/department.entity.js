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
exports.Department = void 0;
const typeorm_1 = require("typeorm");
const company_entity_1 = require("./company.entity");
const user_entity_1 = require("../../users/entities/user.entity");
let Department = class Department {
};
exports.Department = Department;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Department.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Department.prototype, "company_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Department.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Department.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Department.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Department.prototype, "manager_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Department.prototype, "parent_department_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], Department.prototype, "active", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Department.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Department.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => company_entity_1.Company, (company) => company.departments),
    (0, typeorm_1.JoinColumn)({ name: 'company_id' }),
    __metadata("design:type", company_entity_1.Company)
], Department.prototype, "company", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => user_entity_1.User, (user) => user.department),
    __metadata("design:type", Array)
], Department.prototype, "users", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Department, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'parent_department_id' }),
    __metadata("design:type", Department)
], Department.prototype, "parent_department", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Department, (department) => department.parent_department),
    __metadata("design:type", Array)
], Department.prototype, "sub_departments", void 0);
exports.Department = Department = __decorate([
    (0, typeorm_1.Entity)('departments')
], Department);
//# sourceMappingURL=department.entity.js.map