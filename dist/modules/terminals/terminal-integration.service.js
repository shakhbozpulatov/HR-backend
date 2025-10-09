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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var TerminalIntegrationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalIntegrationService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const terminal_device_entity_1 = require("./entities/terminal-device.entity");
const schedule_1 = require("@nestjs/schedule");
const axios_1 = __importDefault(require("axios"));
const user_entity_1 = require("../users/entities/user.entity");
let TerminalIntegrationService = TerminalIntegrationService_1 = class TerminalIntegrationService {
    constructor(deviceRepository, userRepository, configService) {
        this.deviceRepository = deviceRepository;
        this.userRepository = userRepository;
        this.configService = configService;
        this.logger = new common_1.Logger(TerminalIntegrationService_1.name);
        this.vendorApiUrl = this.configService.get('VENDOR_API_URL');
        this.vendorApiKey = this.configService.get('VENDOR_API_KEY');
    }
    async createTerminalUser(request) {
        try {
            const response = await axios_1.default.post(`${this.vendorApiUrl}/users`, request, {
                headers: {
                    Authorization: `Bearer ${this.vendorApiKey}`,
                    'Content-Type': 'application/json',
                },
                timeout: 10000,
            });
            this.logger.log(`Created terminal user: ${response.data.terminal_user_id}`);
            return response.data.terminal_user_id;
        }
        catch (error) {
            this.logger.error(`Failed to create terminal user: ${error.message}`);
            throw error;
        }
    }
    async updateTerminalUser(terminalUserId, updates) {
        try {
            await axios_1.default.patch(`${this.vendorApiUrl}/users/${terminalUserId}`, updates, {
                headers: {
                    Authorization: `Bearer ${this.vendorApiKey}`,
                    'Content-Type': 'application/json',
                },
                timeout: 10000,
            });
            this.logger.log(`Updated terminal user: ${terminalUserId}`);
        }
        catch (error) {
            this.logger.error(`Failed to update terminal user ${terminalUserId}: ${error.message}`);
            throw error;
        }
    }
    async deleteTerminalUser(terminalUserId) {
        try {
            await axios_1.default.delete(`${this.vendorApiUrl}/users/${terminalUserId}`, {
                headers: {
                    Authorization: `Bearer ${this.vendorApiKey}`,
                },
                timeout: 10000,
            });
            this.logger.log(`Deleted terminal user: ${terminalUserId}`);
        }
        catch (error) {
            this.logger.error(`Failed to delete terminal user ${terminalUserId}: ${error.message}`);
            throw error;
        }
    }
    async syncTerminalUsers() {
        try {
            this.logger.log('Starting terminal user synchronization');
            const response = await axios_1.default.get(`${this.vendorApiUrl}/users`, {
                headers: {
                    Authorization: `Bearer ${this.vendorApiKey}`,
                },
                timeout: 30000,
            });
            const vendorUsers = response.data.users || [];
            const vendorUserMap = new Map(vendorUsers.map((user) => [user.terminal_user_external_id, user]));
            const employees = await this.userRepository.find({
                where: { status: 'active' },
            });
            const syncResults = {
                created: 0,
                updated: 0,
                missing: 0,
                errors: 0,
            };
            for (const employee of employees) {
                try {
                    if (!employee.terminal_user_id) {
                        const terminalUserId = await this.createTerminalUser({
                            display_name: `${employee.first_name} ${employee.last_name}`,
                            terminal_user_external_id: employee.id,
                        });
                        employee.terminal_user_id = terminalUserId;
                        await this.userRepository.save(employee);
                        syncResults.created++;
                    }
                    else {
                        const vendorUser = vendorUserMap.get(employee.id);
                        if (!vendorUser) {
                            this.logger.warn(`Terminal user not found in vendor system: ${employee.terminal_user_id}`);
                            syncResults.missing++;
                        }
                        else {
                            syncResults.updated++;
                        }
                    }
                }
                catch (error) {
                    this.logger.error(`Failed to sync employee ${employee.id}: ${error.message}`);
                    syncResults.errors++;
                }
            }
            this.logger.log(`Terminal sync completed: ${JSON.stringify(syncResults)}`);
        }
        catch (error) {
            this.logger.error(`Terminal synchronization failed: ${error.message}`);
        }
    }
    async pullMissedEvents(deviceId, hours = 72) {
        try {
            const startTime = new Date();
            startTime.setHours(startTime.getHours() - hours);
            const params = {
                start_time: startTime.toISOString(),
                end_time: new Date().toISOString(),
                ...(deviceId && { device_id: deviceId }),
            };
            const response = await axios_1.default.get(`${this.vendorApiUrl}/events`, {
                headers: {
                    Authorization: `Bearer ${this.vendorApiKey}`,
                },
                params,
                timeout: 30000,
            });
            const events = response.data.events || [];
            this.logger.log(`Pulled ${events.length} missed events`);
        }
        catch (error) {
            this.logger.error(`Failed to pull missed events: ${error.message}`);
        }
    }
    async dailySync() {
        this.logger.log('Running daily terminal synchronization');
        await this.syncTerminalUsers();
        await this.pullMissedEvents();
    }
    async retryFailedOperations() {
        const pendingEmployees = await this.userRepository.find({
            where: {
                status: 'active',
                terminal_user_id: null,
            },
        });
        for (const employee of pendingEmployees) {
            try {
                const terminalUserId = await this.createTerminalUser({
                    display_name: `${employee.first_name} ${employee.last_name}`,
                    terminal_user_external_id: employee.id,
                });
                employee.terminal_user_id = terminalUserId;
                await this.userRepository.save(employee);
                this.logger.log(`Successfully created terminal user for employee ${employee.id}`);
            }
            catch (error) {
                this.logger.error(`Retry failed for employee ${employee.id}: ${error.message}`);
            }
        }
    }
};
exports.TerminalIntegrationService = TerminalIntegrationService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_2AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TerminalIntegrationService.prototype, "dailySync", null);
exports.TerminalIntegrationService = TerminalIntegrationService = TerminalIntegrationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(terminal_device_entity_1.TerminalDevice)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService])
], TerminalIntegrationService);
//# sourceMappingURL=terminal-integration.service.js.map