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
exports.HcApiConfig = void 0;
const common_1 = require("@nestjs/common");
let HcApiConfig = class HcApiConfig {
    constructor() {
        this.baseUrl = process.env.HC_API_URL || '';
        this.accessToken = process.env.HC_ACCESS_TOKEN || '';
    }
    getBaseUrl() {
        return this.baseUrl;
    }
    getAccessToken() {
        return this.accessToken;
    }
    getDefaultTimeout() {
        return 10000;
    }
    getHeaders() {
        return {
            token: this.accessToken,
            'Content-Type': 'application/json',
        };
    }
    getEndpoints() {
        return {
            person: {
                add: '/person/v1/persons/add',
                update: '/person/v1/persons/update',
                delete: '/person/v1/persons/delete',
                get: '/person/v1/persons/get',
                list: '/person/v1/persons/list',
            },
            terminal: {
                bind: '/terminal/v1/bind',
                unbind: '/terminal/v1/unbind',
            },
        };
    }
    validate() {
        if (!this.baseUrl) {
            throw new Error('HC_API_URL environment variable is required');
        }
        if (!this.accessToken) {
            throw new Error('HC_ACCESS_TOKEN environment variable is required');
        }
    }
};
exports.HcApiConfig = HcApiConfig;
exports.HcApiConfig = HcApiConfig = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], HcApiConfig);
//# sourceMappingURL=hc-api.config.js.map