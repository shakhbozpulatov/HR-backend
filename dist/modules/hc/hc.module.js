"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HcModule = void 0;
const common_1 = require("@nestjs/common");
const hc_service_1 = require("./hc.service");
const hc_api_client_service_1 = require("./services/hc-api-client.service");
const hc_api_config_1 = require("./config/hc-api.config");
let HcModule = class HcModule {
};
exports.HcModule = HcModule;
exports.HcModule = HcModule = __decorate([
    (0, common_1.Module)({
        providers: [
            hc_api_config_1.HcApiConfig,
            hc_api_client_service_1.HcApiClient,
            hc_service_1.HcService,
        ],
        exports: [hc_service_1.HcService],
    })
], HcModule);
//# sourceMappingURL=hc.module.js.map