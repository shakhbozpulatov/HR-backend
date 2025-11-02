import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThanOrEqual, Repository, IsNull } from 'typeorm';
import { UserScheduleAssignment } from './entities/employee-schedule-assignment.entity';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateUserAssignmentDto } from './dto/update-user-assignment.dto';
import { CreateExceptionDto } from './dto/create-exception.dto';
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

    const assignments = await this.assignmentRepository.find({
      where: { user_id: userId },
      relations: ['default_template'],
      order: { effective_from: 'DESC' },
    });

    // Clean up invalid exceptions (empty arrays or non-objects)
    assignments.forEach((assignment) => {
      if (assignment.exceptions && Array.isArray(assignment.exceptions)) {
        assignment.exceptions = assignment.exceptions.filter(
          (exc) => exc && typeof exc === 'object' && !Array.isArray(exc),
        );
      }
    });

    return assignments;
  }

  /**
   * Add schedule exception — only to same company employee
   */
  async addException(
    assignmentId: string,
    exception: CreateExceptionDto,
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

    // Initialize exceptions array if not exists
    if (!assignment.exceptions || !Array.isArray(assignment.exceptions)) {
      assignment.exceptions = [];
    }

    // Filter out any invalid entries (like empty arrays or non-objects)
    assignment.exceptions = assignment.exceptions.filter(
      (exc) => exc && typeof exc === 'object' && !Array.isArray(exc),
    );

    assignment.exceptions.push(exception);
    return await this.assignmentRepository.save(assignment);
  }

  /**
   * Update employee's schedule template
   * This closes the current assignment and creates a new one with the new template
   */
  async updateTemplate(
    updateTemplateDto: UpdateUserAssignmentDto,
    actor: any,
  ): Promise<UserScheduleAssignment> {
    // 1️⃣ Xodimni topamiz
    const employee = await this.userRepository.findOne({
      where: { id: updateTemplateDto.user_id },
      select: ['id', 'company_id', 'first_name', 'last_name'],
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // 2️⃣ SUPER_ADMIN bo'lmasa — faqat o'z company'ga tegishli xodimni o'zgartira oladi
    if (
      actor.role !== UserRole.SUPER_ADMIN &&
      employee.company_id !== actor.company_id
    ) {
      throw new ForbiddenException(
        'You can only update schedules for your own company employees',
      );
    }

    // 3️⃣ Hozirgi aktiv assignmentni topamiz (effective_to = null)
    const currentAssignment = await this.assignmentRepository.findOne({
      where: {
        user_id: updateTemplateDto.user_id,
        effective_to: IsNull(),
      },
      order: { effective_from: 'DESC' },
    });

    if (!currentAssignment) {
      throw new NotFoundException(
        'No active assignment found for this employee',
      );
    }

    // 4️⃣ Yangi effective_from eski effective_from dan kichik bo'lmasligi kerak
    if (updateTemplateDto.effective_from < currentAssignment.effective_from) {
      throw new BadRequestException(
        'New effective_from must be after current assignment start date',
      );
    }

    // 5️⃣ Eski assignmentni tugatamiz (effective_to ni o'rnatamiz)
    const dayBeforeNewEffective = new Date(updateTemplateDto.effective_from);
    dayBeforeNewEffective.setDate(dayBeforeNewEffective.getDate() - 1);
    currentAssignment.effective_to = dayBeforeNewEffective;
    await this.assignmentRepository.save(currentAssignment);

    // 6️⃣ Yangi assignment yaratamiz
    const newAssignment = this.assignmentRepository.create({
      user_id: updateTemplateDto.user_id,
      default_template_id: updateTemplateDto.new_template_id,
      effective_from: updateTemplateDto.effective_from,
      effective_to: updateTemplateDto.effective_to,
    });

    return await this.assignmentRepository.save(newAssignment);
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
