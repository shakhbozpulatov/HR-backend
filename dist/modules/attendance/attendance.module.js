"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const attendance_events_controller_1 = require("./attendance-events.controller");
const attendance_records_controller_1 = require("./attendance-records.controller");
const attendance_events_service_1 = require("./attendance-events.service");
const attendance_records_service_1 = require("./attendance-records.service");
const attendance_event_entity_1 = require("./entities/attendance-event.entity");
const attendance_record_entity_1 = require("./entities/attendance-record.entity");
const crypto_utils_1 = require("../../common/utils/crypto.utils");
let AttendanceModule = class AttendanceModule {
};
exports.AttendanceModule = AttendanceModule;
exports.AttendanceModule = AttendanceModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([attendance_event_entity_1.AttendanceEvent, attendance_record_entity_1.AttendanceRecord])],
        controllers: [attendance_events_controller_1.AttendanceEventsController, attendance_records_controller_1.AttendanceRecordsController],
        providers: [attendance_events_service_1.AttendanceEventsService, attendance_records_service_1.AttendanceRecordsService, crypto_utils_1.CryptoUtils],
        exports: [attendance_events_service_1.AttendanceEventsService, attendance_records_service_1.AttendanceRecordsService],
    })
], AttendanceModule);
//# sourceMappingURL=attendance.module.js.map