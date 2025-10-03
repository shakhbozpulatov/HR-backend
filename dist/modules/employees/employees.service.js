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
exports.EmployeesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const employee_entity_1 = require("./entities/employee.entity");
const user_entity_1 = require("../users/entities/user.entity");
let EmployeesService = class EmployeesService {
    constructor(employeeRepository) {
        this.employeeRepository = employeeRepository;
    }
    async create(createEmployeeDto, companyId) {
        const existingEmployee = await this.employeeRepository.findOne({
            where: {
                email: createEmployeeDto.email,
                company_id: companyId,
            },
        });
        if (existingEmployee) {
            throw new common_1.BadRequestException('Employee email already exists in this company');
        }
        const employee = this.employeeRepository.create({
            ...createEmployeeDto,
            company_id: companyId,
        });
        return await this.employeeRepository.save(employee);
    }
    async findAll(filterDto, companyId, userRole) {
        const { page = 1, limit = 10, status, department, location, search, } = filterDto;
        const queryBuilder = this.employeeRepository
            .createQueryBuilder('employee')
            .leftJoinAndSelect('employee.manager', 'manager')
            .leftJoinAndSelect('employee.company', 'company');
        if (userRole !== user_entity_1.UserRole.SUPER_ADMIN) {
            queryBuilder.andWhere('employee.company_id = :companyId', { companyId });
        }
        if (status) {
            queryBuilder.andWhere('employee.status = :status', { status });
        }
        if (department) {
            queryBuilder.andWhere('employee.department = :department', {
                department,
            });
        }
        if (location) {
            queryBuilder.andWhere('employee.location = :location', { location });
        }
        if (search) {
            queryBuilder.andWhere('(employee.first_name ILIKE :search OR employee.last_name ILIKE :search OR employee.code ILIKE :search)', { search: `%${search}%` });
        }
        const [data, total] = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();
        return { data, total };
    }
    async findOne(id) {
        const employee = await this.employeeRepository.findOne({
            where: { id },
            relations: ['manager'],
        });
        if (!employee) {
            throw new common_1.NotFoundException('Employee not found');
        }
        return employee;
    }
    async update(id, updateEmployeeDto) {
        const employee = await this.findOne(id);
        Object.assign(employee, updateEmployeeDto);
        return await this.employeeRepository.save(employee);
    }
    async remove(id) {
        const employee = await this.findOne(id);
        employee.status = employee_entity_1.EmployeeStatus.INACTIVE;
        employee.end_date = new Date();
        await this.employeeRepository.save(employee);
    }
};
exports.EmployeesService = EmployeesService;
exports.EmployeesService = EmployeesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(employee_entity_1.Employee)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], EmployeesService);
//# sourceMappingURL=employees.service.js.map