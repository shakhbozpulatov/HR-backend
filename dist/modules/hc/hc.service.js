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
exports.HcService = void 0;
const common_1 = require("@nestjs/common");
const hc_api_client_service_1 = require("./services/hc-api-client.service");
const hc_api_config_1 = require("./config/hc-api.config");
const hc_date_util_1 = require("./utils/hc-date.util");
let HcService = class HcService {
    constructor(apiClient, config) {
        this.apiClient = apiClient;
        this.config = config;
    }
    onModuleInit() {
        try {
            this.config.validate();
            console.log('✅ HC Service initialized successfully', {
                baseUrl: this.config.getBaseUrl(),
                hasToken: !!this.config.getAccessToken(),
            });
        }
        catch (error) {
            console.error('❌ HC Service initialization failed:', error.message);
            throw error;
        }
    }
    async createUserOnCabinet(dto) {
        const endpoint = this.config.getEndpoints().person.add;
        const formattedDto = {
            ...dto,
            startDate: hc_date_util_1.HcDateFormatter.toHcFormat(dto.startDate),
            endDate: dto.endDate
                ? hc_date_util_1.HcDateFormatter.toHcFormat(dto.endDate)
                : undefined,
        };
        return this.apiClient.post({
            endpoint,
            data: formattedDto,
        });
    }
    async updateUserOnCabinet(personId, updateData) {
        const endpoint = this.config.getEndpoints().person.update;
        const formattedDto = { ...updateData, personId };
        if (updateData.startDate) {
            formattedDto.startDate = hc_date_util_1.HcDateFormatter.toHcFormat(updateData.startDate);
        }
        if (updateData.endDate) {
            formattedDto.endDate = hc_date_util_1.HcDateFormatter.toHcFormat(updateData.endDate);
        }
        return this.apiClient.post({
            endpoint,
            data: formattedDto,
        });
    }
    async getUserFromCabinet(personId) {
        const endpoint = this.config.getEndpoints().person.get;
        return this.apiClient.post({
            endpoint,
            data: { personId },
        });
    }
    async deleteUserFromCabinet(personId) {
        const endpoint = this.config.getEndpoints().person.delete;
        return this.apiClient.post({
            endpoint,
            data: { personId },
        });
    }
    async bindUserWithTerminal(data) {
        const endpoint = this.config.getEndpoints().terminal.bind;
        return this.apiClient.post({
            endpoint,
            data,
        });
    }
    async unbindUserFromTerminal(data) {
        const endpoint = this.config.getEndpoints().terminal.unbind;
        return this.apiClient.post({
            endpoint,
            data,
        });
    }
};
exports.HcService = HcService;
exports.HcService = HcService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [hc_api_client_service_1.HcApiClient,
        hc_api_config_1.HcApiConfig])
], HcService);
//# sourceMappingURL=hc.service.js.map