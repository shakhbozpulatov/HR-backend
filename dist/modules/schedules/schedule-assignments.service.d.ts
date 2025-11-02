import { Repository } from 'typeorm';
import { UserScheduleAssignment } from './entities/employee-schedule-assignment.entity';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateUserAssignmentDto } from './dto/update-user-assignment.dto';
import { CreateExceptionDto } from './dto/create-exception.dto';
import { User } from '@/modules/users/entities/user.entity';
export declare class ScheduleAssignmentsService {
    private assignmentRepository;
    private userRepository;
    constructor(assignmentRepository: Repository<UserScheduleAssignment>, userRepository: Repository<User>);
    createAssignment(createAssignmentDto: CreateAssignmentDto, actor: any): Promise<UserScheduleAssignment>;
    findEmployeeAssignments(userId: string, actor: any): Promise<UserScheduleAssignment[]>;
    addException(assignmentId: string, exception: CreateExceptionDto, actor: any): Promise<UserScheduleAssignment>;
    updateTemplate(updateTemplateDto: UpdateUserAssignmentDto, actor: any): Promise<UserScheduleAssignment>;
    getEffectiveSchedule(userId: string, date: Date, actor?: any): Promise<any>;
}
