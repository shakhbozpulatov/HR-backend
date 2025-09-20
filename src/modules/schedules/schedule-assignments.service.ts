import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeScheduleAssignment } from './entities/employee-schedule-assignment.entity';
import { CreateAssignmentDto } from './dto/create-assignment.dto';

@Injectable()
export class ScheduleAssignmentsService {
  constructor(
    @InjectRepository(EmployeeScheduleAssignment)
    private assignmentRepository: Repository<EmployeeScheduleAssignment>,
  ) {}

  async createAssignment(
    createAssignmentDto: CreateAssignmentDto,
  ): Promise<EmployeeScheduleAssignment> {
    const assignment = this.assignmentRepository.create(createAssignmentDto);
    return await this.assignmentRepository.save(assignment);
  }

  async findEmployeeAssignments(
    employeeId: string,
  ): Promise<EmployeeScheduleAssignment[]> {
    return await this.assignmentRepository.find({
      where: { employee_id: employeeId },
      relations: ['default_template'],
      order: { effective_from: 'DESC' },
    });
  }

  async getEffectiveSchedule(employeeId: string, date: Date): Promise<any> {
    const assignment = await this.assignmentRepository.findOne({
      where: {
        employee_id: employeeId,
        effective_from: { $lte: date } as any,
        effective_to: { $gte: date } as any,
      },
      relations: ['default_template'],
      order: { effective_from: 'DESC' },
    });

    if (!assignment) {
      return null;
    }

    // Check for exceptions on this date
    const dateStr = date.toISOString().split('T')[0];
    const exception = assignment.exceptions?.find(
      (exc) =>
        exc.date === dateStr ||
        (exc.start_date &&
          exc.end_date &&
          dateStr >= exc.start_date &&
          dateStr <= exc.end_date),
    );

    if (exception) {
      if (exception.type === 'OFF') {
        return null;
      }
      // Return alternate template if specified
    }

    return assignment.default_template;
  }

  async addException(
    assignmentId: string,
    exception: any,
  ): Promise<EmployeeScheduleAssignment> {
    const assignment = await this.assignmentRepository.findOne({
      where: { assignment_id: assignmentId },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    if (!assignment.exceptions) {
      assignment.exceptions = [];
    }

    assignment.exceptions.push(exception);
    return await this.assignmentRepository.save(assignment);
  }
}
