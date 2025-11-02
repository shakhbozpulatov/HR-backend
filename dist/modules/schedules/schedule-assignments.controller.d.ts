import { ScheduleAssignmentsService } from './schedule-assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateUserAssignmentDto } from './dto/update-user-assignment.dto';
import { CreateExceptionDto } from './dto/create-exception.dto';
export declare class ScheduleAssignmentsController {
    private readonly assignmentsService;
    constructor(assignmentsService: ScheduleAssignmentsService);
    createAssignment(createAssignmentDto: CreateAssignmentDto, req: any): Promise<import("./entities/employee-schedule-assignment.entity").UserScheduleAssignment>;
    getEmployeeAssignments(userId: string, req: any): Promise<import("./entities/employee-schedule-assignment.entity").UserScheduleAssignment[]>;
    updateTemplate(updateTemplateDto: UpdateUserAssignmentDto, req: any): Promise<import("./entities/employee-schedule-assignment.entity").UserScheduleAssignment>;
    addException(assignmentId: string, exception: CreateExceptionDto, req: any): Promise<import("./entities/employee-schedule-assignment.entity").UserScheduleAssignment>;
}
