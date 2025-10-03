import { Repository } from 'typeorm';
import { UserScheduleAssignment } from './entities/employee-schedule-assignment.entity';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
export declare class ScheduleAssignmentsService {
    private assignmentRepository;
    constructor(assignmentRepository: Repository<UserScheduleAssignment>);
    createAssignment(createAssignmentDto: CreateAssignmentDto): Promise<UserScheduleAssignment>;
    findEmployeeAssignments(employeeId: string): Promise<UserScheduleAssignment[]>;
    getEffectiveSchedule(employeeId: string, date: Date): Promise<any>;
    addException(assignmentId: string, exception: any): Promise<UserScheduleAssignment>;
}
