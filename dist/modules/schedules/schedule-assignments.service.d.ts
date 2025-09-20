import { Repository } from 'typeorm';
import { EmployeeScheduleAssignment } from './entities/employee-schedule-assignment.entity';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
export declare class ScheduleAssignmentsService {
    private assignmentRepository;
    constructor(assignmentRepository: Repository<EmployeeScheduleAssignment>);
    createAssignment(createAssignmentDto: CreateAssignmentDto): Promise<EmployeeScheduleAssignment>;
    findEmployeeAssignments(employeeId: string): Promise<EmployeeScheduleAssignment[]>;
    getEffectiveSchedule(employeeId: string, date: Date): Promise<any>;
    addException(assignmentId: string, exception: any): Promise<EmployeeScheduleAssignment>;
}
