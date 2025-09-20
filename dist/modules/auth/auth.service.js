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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const user_entity_1 = require("../users/entities/user.entity");
const crypto_utils_1 = require("../../common/utils/crypto.utils");
let AuthService = class AuthService {
    constructor(userRepository, jwtService, cryptoUtils) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.cryptoUtils = cryptoUtils;
    }
    async login(loginDto) {
        const { email, password } = loginDto;
        const user = await this.userRepository.findOne({
            where: { email, active: true },
            relations: ['employee'],
        });
        if (!user ||
            !this.cryptoUtils.comparePassword(password, user.password_hash)) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const payload = {
            sub: user.user_id,
            email: user.email,
            role: user.role,
            employee_id: user.employee_id,
        };
        const access_token = this.jwtService.sign(payload);
        return {
            access_token,
            user: {
                user_id: user.user_id,
                email: user.email,
                role: user.role,
                employee: user.employee,
            },
        };
    }
    async validateUser(payload) {
        const user = await this.userRepository.findOne({
            where: { user_id: payload.sub, active: true },
        });
        if (!user) {
            throw new common_1.UnauthorizedException();
        }
        return user;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        jwt_1.JwtService,
        crypto_utils_1.CryptoUtils])
], AuthService);
//# sourceMappingURL=auth.service.js.map