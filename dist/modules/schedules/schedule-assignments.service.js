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
exports.ScheduleAssignmentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const employee_schedule_assignment_entity_1 = require("./entities/employee-schedule-assignment.entity");
let ScheduleAssignmentsService = class ScheduleAssignmentsService {
    constructor(assignmentRepository) {
        this.assignmentRepository = assignmentRepository;
    }
    async createAssignment(createAssignmentDto) {
        const assignment = this.assignmentRepository.create(createAssignmentDto);
        return await this.assignmentRepository.save(assignment);
    }
    async findEmployeeAssignments(employeeId) {
        return await this.assignmentRepository.find({
            where: { user_id: employeeId },
            relations: ['default_template'],
            order: { effective_from: 'DESC' },
        });
    }
    async getEffectiveSchedule(employeeId, date) {
        const assignment = await this.assignmentRepository.findOne({
            where: {
                user_id: employeeId,
                effective_from: { $lte: date },
                effective_to: { $gte: date },
            },
            relations: ['default_template'],
            order: { effective_from: 'DESC' },
        });
        if (!assignment) {
            return null;
        }
        const dateStr = date.toISOString().split('T')[0];
        const exception = assignment.exceptions?.find((exc) => exc.date === dateStr ||
            (exc.start_date &&
                exc.end_date &&
                dateStr >= exc.start_date &&
                dateStr <= exc.end_date));
        if (exception) {
            if (exception.type === 'OFF') {
                return null;
            }
        }
        return assignment.default_template;
    }
    async addException(assignmentId, exception) {
        const assignment = await this.assignmentRepository.findOne({
            where: { assignment_id: assignmentId },
        });
        if (!assignment) {
            throw new common_1.NotFoundException('Assignment not found');
        }
        if (!assignment.exceptions) {
            assignment.exceptions = [];
        }
        assignment.exceptions.push(exception);
        return await this.assignmentRepository.save(assignment);
    }
};
exports.ScheduleAssignmentsService = ScheduleAssignmentsService;
exports.ScheduleAssignmentsService = ScheduleAssignmentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(employee_schedule_assignment_entity_1.UserScheduleAssignment)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ScheduleAssignmentsService);
//# sourceMappingURL=schedule-assignments.service.js.map