"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const passport_1 = require("@nestjs/passport");
const auth_controller_1 = require("./auth.controller");
const auth_service_1 = require("./auth.service");
const user_entity_1 = require("../users/entities/user.entity");
const company_entity_1 = require("../company/entities/company.entity");
const jwt_strategy_1 = require("./strategies/jwt.strategy");
const crypto_utils_1 = require("../../common/utils/crypto.utils");
const hc_service_1 = require("../hc/hc.service");
const hc_api_config_1 = require("../hc/config/hc-api.config");
const hc_api_client_service_1 = require("../hc/services/hc-api-client.service");
const password_service_1 = require("./services/password.service");
const permission_service_1 = require("./services/permission.service");
const company_service_1 = require("./services/company.service");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([user_entity_1.User, company_entity_1.Company]),
            passport_1.PassportModule,
        ],
        controllers: [auth_controller_1.AuthController],
        providers: [
            auth_service_1.AuthService,
            jwt_strategy_1.JwtStrategy,
            crypto_utils_1.CryptoUtils,
            password_service_1.PasswordService,
            permission_service_1.PermissionService,
            company_service_1.CompanyService,
            hc_service_1.HcService,
            hc_api_config_1.HcApiConfig,
            hc_api_client_service_1.HcApiClient,
        ],
        exports: [
            auth_service_1.AuthService,
            password_service_1.PasswordService,
            permission_service_1.PermissionService,
        ],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map