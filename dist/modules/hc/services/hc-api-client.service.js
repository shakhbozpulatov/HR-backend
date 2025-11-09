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
exports.HcApiClient = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
const hc_api_config_1 = require("../config/hc-api.config");
let HcApiClient = class HcApiClient {
    constructor(config) {
        this.config = config;
        this.axiosInstance = axios_1.default.create({
            baseURL: this.config.getBaseUrl(),
            timeout: this.config.getDefaultTimeout(),
            headers: this.config.getHeaders(),
        });
        this.setupInterceptors();
    }
    setupInterceptors() {
        this.axiosInstance.interceptors.request.use((config) => {
            console.log('🔄 HC API Request:', {
                url: config.url,
                method: config.method?.toUpperCase(),
                data: config.data,
            });
            return config;
        }, (error) => {
            console.error('❌ HC API Request Error:', error);
            return Promise.reject(error);
        });
        this.axiosInstance.interceptors.response.use((response) => {
            console.log('📥 HC API Response:', {
                status: response.status,
                data: response.data,
            });
            return response;
        }, (error) => {
            console.error('❌ HC API Response Error:', error.response?.data);
            return Promise.reject(error);
        });
    }
    async post(options) {
        try {
            const requestConfig = {
                timeout: options.timeout || this.config.getDefaultTimeout(),
            };
            const response = await this.axiosInstance.post(options.endpoint, options.data, requestConfig);
            return this.validateResponse(response.data);
        }
        catch (error) {
            throw this.handleError(error, options);
        }
    }
    async get(endpoint, params) {
        try {
            const response = await this.axiosInstance.get(endpoint, { params });
            return this.validateResponse(response.data);
        }
        catch (error) {
            throw this.handleError(error, { endpoint, data: params });
        }
    }
    validateResponse(responseData) {
        const { errorCode, message } = responseData;
        if (errorCode !== '0' && errorCode !== 0) {
            console.error('❌ HC API Error (errorCode not 0):', {
                errorCode,
                message,
                fullResponse: responseData,
            });
            throw new common_1.HttpException({
                message: 'HC API returned an error',
                error: message || 'Unknown error from HC system',
                errorCode,
                details: responseData,
            }, common_1.HttpStatus.BAD_REQUEST);
        }
        console.log('✅ HC API Success (errorCode: 0):', {
            data: responseData.data,
        });
        return responseData;
    }
    handleError(error, options) {
        if (error instanceof common_1.HttpException) {
            return error;
        }
        const errorDetails = {
            message: error.message,
            endpoint: options.endpoint,
            requestData: options.data,
            responseStatus: error.response?.status,
            responseData: error.response?.data,
        };
        console.error('❌ HC API Error Details:', JSON.stringify(errorDetails, null, 2));
        const errorMessage = error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            'Unknown error occurred';
        return new common_1.HttpException({
            message: 'Failed to communicate with HC system',
            error: errorMessage,
            details: error.response?.data,
        }, error.response?.status || common_1.HttpStatus.BAD_GATEWAY);
    }
};
exports.HcApiClient = HcApiClient;
exports.HcApiClient = HcApiClient = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [hc_api_config_1.HcApiConfig])
], HcApiClient);
//# sourceMappingURL=hc-api-client.service.js.map