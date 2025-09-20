import { ScheduleAssignmentsService } from './schedule-assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
export declare class ScheduleAssignmentsController {
    private readonly assignmentsService;
    constructor(assignmentsService: ScheduleAssignmentsService);
    createAssignment(createAssignmentDto: CreateAssignmentDto): Promise<import("./entities/employee-schedule-assignment.entity").EmployeeScheduleAssignment>;
    getEmployeeAssignments(employeeId: string): Promise<import("./entities/employee-schedule-assignment.entity").EmployeeScheduleAssignment[]>;
    addException(assignmentId: string, exception: any): Promise<import("./entities/employee-schedule-assignment.entity").EmployeeScheduleAssignment>;
}
