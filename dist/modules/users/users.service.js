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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./entities/user.entity");
const crypto_utils_1 = require("../../common/utils/crypto.utils");
let UsersService = class UsersService {
    constructor(userRepository, cryptoUtils) {
        this.userRepository = userRepository;
        this.cryptoUtils = cryptoUtils;
    }
    async create(createUserDto) {
        const existingUser = await this.userRepository.findOne({
            where: { email: createUserDto.email },
        });
        if (existingUser) {
            throw new common_1.BadRequestException('Email already exists');
        }
        const hashedPassword = this.cryptoUtils.hashPassword(createUserDto.password);
        const user = this.userRepository.create({
            ...createUserDto,
            password_hash: hashedPassword,
        });
        return await this.userRepository.save(user);
    }
    async findAll() {
        return await this.userRepository.find({
            where: {
                role: (0, typeorm_2.Not)((0, typeorm_2.In)([user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.COMPANY_OWNER])),
            },
        });
    }
    async findOne(id) {
        const user = await this.userRepository.findOne({
            where: { id: id },
            select: ['id', 'email', 'role', 'active', 'created_at'],
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async update(id, updateUserDto) {
        const user = await this.findOne(id);
        if (updateUserDto.password) {
            updateUserDto.password = this.cryptoUtils.hashPassword(updateUserDto.password);
        }
        Object.assign(user, updateUserDto);
        return await this.userRepository.save(user);
    }
    async remove(id) {
        const user = await this.findOne(id);
        user.active = false;
        await this.userRepository.save(user);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        crypto_utils_1.CryptoUtils])
], UsersService);
//# sourceMappingURL=users.service.js.map