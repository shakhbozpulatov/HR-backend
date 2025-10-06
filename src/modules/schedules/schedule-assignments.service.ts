import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { UserScheduleAssignment } from './entities/employee-schedule-assignment.entity';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { User } from '@/modules/users/entities/user.entity';
import { UserRole } from '@/modules/users/entities/user.entity';

@Injectable()
export class ScheduleAssignmentsService {
  constructor(
    @InjectRepository(UserScheduleAssignment)
    private assignmentRepository: Repository<UserScheduleAssignment>,

    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Create new schedule assignment for employee
   * Only users within the same company (or SUPER_ADMIN) can do this
   */
  async createAssignment(
    createAssignmentDto: CreateAssignmentDto,
    actor: any,
  ): Promise<UserScheduleAssignment> {
    // 1️⃣ Xodimni topamiz
    const employee = await this.userRepository.findOne({
      where: { id: createAssignmentDto.user_id },
      select: ['id', 'company_id', 'first_name', 'last_name'],
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // 2️⃣ SUPER_ADMIN bo‘lmasa — faqat o‘z company’ga tegishli xodimni qo‘sha oladi
    if (
      actor.role !== UserRole.SUPER_ADMIN &&
      employee.company_id !== actor.company_id
    ) {
      throw new ForbiddenException(
        'You can only assign schedules to your own company employees',
      );
    }

    // 3️⃣ Assignmentni yaratamiz
    const assignment = this.assignmentRepository.create({
      ...createAssignmentDto,
    });

    return await this.assignmentRepository.save(assignment);
  }

  /**
   * Find all assignments for employee — visible only to same-company users or SUPER_ADMIN
   */
  async findEmployeeAssignments(
    userId: string,
    actor: any,
  ): Promise<UserScheduleAssignment[]> {
    const employee = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'company_id'],
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    if (
      actor.role !== UserRole.SUPER_ADMIN &&
      employee.company_id !== actor.company_id
    ) {
      throw new ForbiddenException(
        'You can only view your own company employees',
      );
    }

    return await this.assignmentRepository.find({
      where: { user_id: userId },
      relations: ['default_template'],
      order: { effective_from: 'DESC' },
    });
  }

  /**
   * Add schedule exception — only to same company employee
   */
  async addException(
    assignmentId: string,
    exception: any,
    actor: any,
  ): Promise<UserScheduleAssignment> {
    const assignment = await this.assignmentRepository.findOne({
      where: { assignment_id: assignmentId },
      relations: ['user'],
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    // company check
    if (
      actor.role !== UserRole.SUPER_ADMIN &&
      assignment.user?.company_id !== actor.company_id
    ) {
      throw new ForbiddenException(
        'You can only edit your own company assignments',
      );
    }

    if (!assignment.exceptions) {
      assignment.exceptions = [];
    }

    assignment.exceptions.push(exception);
    return await this.assignmentRepository.save(assignment);
  }

  async getEffectiveSchedule(
    userId: string,
    date: Date,
    actor?: any,
  ): Promise<any> {
    // 1️⃣ Xodimni topamiz
    const employee = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'company_id'],
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // 2️⃣ Foydalanuvchi company validatsiyasi
    if (
      actor &&
      actor.role !== UserRole.SUPER_ADMIN &&
      employee.company_id !== actor.company_id
    ) {
      throw new ForbiddenException(
        'You can only view schedules of your own company employees',
      );
    }

    // 3️⃣ Xodimning amal qilayotgan assignmentini topamiz
    const assignment = await this.assignmentRepository.findOne({
      where: {
        user_id: userId,
        effective_from: LessThanOrEqual(date),
        effective_to: MoreThanOrEqual(date),
      },
      relations: ['default_template'],
      order: { effective_from: 'DESC' },
    });

    if (!assignment) {
      return null;
    }

    // 4️⃣ Shu sanaga to‘g‘ri keladigan exceptionni tekshiramiz
    const dateStr = date.toISOString().split('T')[0];
    const exception = assignment.exceptions?.find(
      (exc) =>
        exc.date === dateStr ||
        (exc.start_date &&
          exc.end_date &&
          dateStr >= exc.start_date &&
          dateStr <= exc.end_date),
    );

    // 5️⃣ Exception tahlili
    if (exception) {
      if (exception.type === 'OFF') {
        return {
          date: dateStr,
          status: 'OFF',
          message: 'Employee is off on this day',
        };
      }

      if (exception.type === 'ALTERNATE_TEMPLATE' && exception.template_id) {
        // Shu alternate template haqida ham ma’lumot olish mumkin
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

    // 6️⃣ Agar exception topilmasa — default template qaytariladi
    return {
      date: dateStr,
      status: 'DEFAULT',
      template: assignment.default_template,
    };
  }
}
