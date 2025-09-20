import { EmployeeStatus } from '../entities/employee.entity';
export declare class EmployeeFilterDto {
    page?: number;
    limit?: number;
    status?: EmployeeStatus;
    department?: string;
    location?: string;
    search?: string;
}
