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
const user_entity_1 = require("../users/entities/user.entity");
const user_entity_2 = require("../users/entities/user.entity");
let ScheduleAssignmentsService = class ScheduleAssignmentsService {
    constructor(assignmentRepository, userRepository) {
        this.assignmentRepository = assignmentRepository;
        this.userRepository = userRepository;
    }
    async createAssignment(createAssignmentDto, actor) {
        const employee = await this.userRepository.findOne({
            where: { id: createAssignmentDto.user_id },
            select: ['id', 'company_id', 'first_name', 'last_name'],
        });
        if (!employee) {
            throw new common_1.NotFoundException('Employee not found');
        }
        if (actor.role !== user_entity_2.UserRole.SUPER_ADMIN &&
            employee.company_id !== actor.company_id) {
            throw new common_1.ForbiddenException('You can only assign schedules to your own company employees');
        }
        const assignment = this.assignmentRepository.create({
            ...createAssignmentDto,
        });
        return await this.assignmentRepository.save(assignment);
    }
    async findEmployeeAssignments(userId, actor) {
        const employee = await this.userRepository.findOne({
            where: { id: userId },
            select: ['id', 'company_id'],
        });
        if (!employee) {
            throw new common_1.NotFoundException('Employee not found');
        }
        if (actor.role !== user_entity_2.UserRole.SUPER_ADMIN &&
            employee.company_id !== actor.company_id) {
            throw new common_1.ForbiddenException('You can only view your own company employees');
        }
        const assignments = await this.assignmentRepository.find({
            where: { user_id: userId },
            relations: ['default_template'],
            order: { effective_from: 'DESC' },
        });
        assignments.forEach((assignment) => {
            if (assignment.exceptions && Array.isArray(assignment.exceptions)) {
                assignment.exceptions = assignment.exceptions.filter((exc) => exc && typeof exc === 'object' && !Array.isArray(exc));
            }
        });
        return assignments;
    }
    async addException(assignmentId, exception, actor) {
        const assignment = await this.assignmentRepository.findOne({
            where: { assignment_id: assignmentId },
            relations: ['user'],
        });
        if (!assignment) {
            throw new common_1.NotFoundException('Assignment not found');
        }
        if (actor.role !== user_entity_2.UserRole.SUPER_ADMIN &&
            assignment.user?.company_id !== actor.company_id) {
            throw new common_1.ForbiddenException('You can only edit your own company assignments');
        }
        if (!assignment.exceptions || !Array.isArray(assignment.exceptions)) {
            assignment.exceptions = [];
        }
        assignment.exceptions = assignment.exceptions.filter((exc) => exc && typeof exc === 'object' && !Array.isArray(exc));
        assignment.exceptions.push(exception);
        return await this.assignmentRepository.save(assignment);
    }
    async updateTemplate(updateTemplateDto, actor) {
        const employee = await this.userRepository.findOne({
            where: { id: updateTemplateDto.user_id },
            select: ['id', 'company_id', 'first_name', 'last_name'],
        });
        if (!employee) {
            throw new common_1.NotFoundException('Employee not found');
        }
        if (actor.role !== user_entity_2.UserRole.SUPER_ADMIN &&
            employee.company_id !== actor.company_id) {
            throw new common_1.ForbiddenException('You can only update schedules for your own company employees');
        }
        const currentAssignment = await this.assignmentRepository.findOne({
            where: {
                user_id: updateTemplateDto.user_id,
                effective_to: (0, typeorm_2.IsNull)(),
            },
            order: { effective_from: 'DESC' },
        });
        if (!currentAssignment) {
            throw new common_1.NotFoundException('No active assignment found for this employee');
        }
        if (updateTemplateDto.effective_from < currentAssignment.effective_from) {
            throw new common_1.BadRequestException('New effective_from must be after current assignment start date');
        }
        const dayBeforeNewEffective = new Date(updateTemplateDto.effective_from);
        dayBeforeNewEffective.setDate(dayBeforeNewEffective.getDate() - 1);
        currentAssignment.effective_to = dayBeforeNewEffective;
        await this.assignmentRepository.save(currentAssignment);
        const newAssignment = this.assignmentRepository.create({
            user_id: updateTemplateDto.user_id,
            default_template_id: updateTemplateDto.new_template_id,
            effective_from: updateTemplateDto.effective_from,
            effective_to: updateTemplateDto.effective_to,
        });
        return await this.assignmentRepository.save(newAssignment);
    }
    async getEffectiveSchedule(userId, date, actor) {
        const employee = await this.userRepository.findOne({
            where: { id: userId },
            select: ['id', 'company_id'],
        });
        if (!employee) {
            throw new common_1.NotFoundException('Employee not found');
        }
        if (actor &&
            actor.role !== user_entity_2.UserRole.SUPER_ADMIN &&
            employee.company_id !== actor.company_id) {
            throw new common_1.ForbiddenException('You can only view schedules of your own company employees');
        }
        const assignment = await this.assignmentRepository.findOne({
            where: {
                user_id: userId,
                effective_from: (0, typeorm_2.LessThanOrEqual)(date),
                effective_to: (0, typeorm_2.MoreThanOrEqual)(date),
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
                return {
                    date: dateStr,
                    status: 'OFF',
                    message: 'Employee is off on this day',
                };
            }
            if (exception.type === 'ALTERNATE_TEMPLATE' && exception.template_id) {
                const altTemplate = await this.assignmentRepository.manager
                    .getRepository('schedule_templates')
                    .findOne({ where: { template_id: exception.template_id } });
                return {
                    date: dateStr,
                    status: 'ALTERNATE',
                    template: altTemplate,
                };
            }
        }
        return {
            date: dateStr,
            status: 'DEFAULT',
            template: assignment.default_template,
        };
    }
};
exports.ScheduleAssignmentsService = ScheduleAssignmentsService;
exports.ScheduleAssignmentsService = ScheduleAssignmentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(employee_schedule_assignment_entity_1.UserScheduleAssignment)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ScheduleAssignmentsService);
//# sourceMappingURL=schedule-assignments.service.js.map