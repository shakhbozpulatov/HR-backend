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
exports.CompanyGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const user_entity_1 = require("../../modules/users/entities/user.entity");
let CompanyGuard = class CompanyGuard {
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (user.role === user_entity_1.UserRole.SUPER_ADMIN) {
            return true;
        }
        const companyId = request.params.company_id ||
            request.params.id ||
            request.query.company_id ||
            request.body.company_id;
        if (companyId && user.company_id !== companyId) {
            throw new common_1.ForbiddenException('Access denied to this company');
        }
        return true;
    }
};
exports.CompanyGuard = CompanyGuard;
exports.CompanyGuard = CompanyGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], CompanyGuard);
//# sourceMappingURL=company.guard.js.map