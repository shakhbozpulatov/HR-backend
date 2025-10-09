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
const bull_1 = require("@nestjs/bull");
const throttler_1 = require("@nestjs/throttler");
const attendance_event_entity_1 = require("./entities/attendance-event.entity");
const attendance_record_entity_1 = require("./entities/attendance-record.entity");
const user_device_mapping_entity_1 = require("./entities/user-device-mapping.entity");
const attendance_processing_log_entity_1 = require("./entities/attendance-processing-log.entity");
const attendance_events_service_1 = require("./services/attendance-events.service");
const attendance_records_service_1 = require("./services/attendance-records.service");
const attendance_processor_service_1 = require("./services/attendance-processor.service");
const user_device_mapping_service_1 = require("./services/user-device-mapping.service");
const controllers_1 = require("./controllers");
const controllers_2 = require("./controllers");
const controllers_3 = require("./controllers");
const controllers_4 = require("./controllers");
const controllers_5 = require("./controllers");
const attendance_queue_processor_1 = require("./processors/attendance-queue.processor");
const attendance_cron_service_1 = require("./cron/attendance-cron.service");
const schedules_module_1 = require("../schedules/schedules.module");
const holidays_module_1 = require("../holidays/holidays.module");
let AttendanceModule = class AttendanceModule {
};
exports.AttendanceModule = AttendanceModule;
exports.AttendanceModule = AttendanceModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                attendance_event_entity_1.AttendanceEvent,
                attendance_record_entity_1.AttendanceRecord,
                user_device_mapping_entity_1.UserDeviceMapping,
                attendance_processing_log_entity_1.AttendanceProcessingLog,
            ]),
            bull_1.BullModule.registerQueue({
                name: 'attendance',
                defaultJobOptions: {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 2000 },
                    removeOnComplete: true,
                    removeOnFail: false,
                },
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    name: 'short',
                    ttl: 60000,
                    limit: 100,
                },
                {
                    name: 'medium',
                    ttl: 600000,
                    limit: 500,
                },
                {
                    name: 'long',
                    ttl: 3600000,
                    limit: 1000,
                },
            ]),
            schedules_module_1.SchedulesModule,
            holidays_module_1.HolidaysModule,
        ],
        controllers: [
            controllers_1.AttendanceEventsController,
            controllers_2.AttendanceRecordsController,
            controllers_3.DeviceEnrollmentController,
            controllers_4.DeviceStatusController,
            controllers_5.BatchProcessingController,
        ],
        providers: [
            attendance_events_service_1.AttendanceEventsService,
            attendance_records_service_1.AttendanceRecordsService,
            attendance_processor_service_1.AttendanceProcessorService,
            user_device_mapping_service_1.UserDeviceMappingService,
            attendance_queue_processor_1.AttendanceQueueProcessor,
            attendance_cron_service_1.AttendanceCronService,
        ],
        exports: [
            attendance_events_service_1.AttendanceEventsService,
            attendance_records_service_1.AttendanceRecordsService,
            attendance_processor_service_1.AttendanceProcessorService,
            user_device_mapping_service_1.UserDeviceMappingService,
        ],
    })
], AttendanceModule);
//# sourceMappingURL=attendance.module.js.map