import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
  IsNull,
  In,
} from 'typeorm';
import { UserScheduleAssignment } from './entities/employee-schedule-assignment.entity';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateUserAssignmentDto } from './dto/update-user-assignment.dto';
import { BulkUpdateAssignmentDto } from './dto/bulk-update-assignment.dto';
import { BulkDeleteAssignmentDto } from './dto/bulk-delete-assignment.dto';
import { CreateExceptionDto } from './dto/create-exception.dto';
import { DeleteExceptionDto } from './dto/delete-exception.dto';
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
   * Create new schedule assignment for employee(s)
   * Only users within the same company (or SUPER_ADMIN) can do this
   * Supports bulk assignment for multiple users
   * If assignment already exists for same user + effective_from, it will be updated
   */
  async createAssignment(
    createAssignmentDto: CreateAssignmentDto,
    actor: any,
  ): Promise<UserScheduleAssignment | UserScheduleAssignment[]> {
    const userIds = createAssignmentDto.user_id;
    const createdAssignments: UserScheduleAssignment[] = [];

    // Loop through all user IDs
    for (const userId of userIds) {
      // 1️⃣ Xodimni topamiz
      const employee = await this.userRepository.findOne({
        where: { id: userId },
        select: ['id', 'company_id', 'first_name', 'last_name'],
      });

      if (!employee) {
        throw new NotFoundException(`Employee with ID ${userId} not found`);
      }

      // 2️⃣ SUPER_ADMIN bo'lmasa — faqat o'z company'ga tegishli xodimni qo'sha oladi
      if (
        actor.role !== UserRole.SUPER_ADMIN &&
        employee.company_id !== actor.company_id
      ) {
        throw new ForbiddenException(
          `You can only assign schedules to your own company employees (failed for user ${userId})`,
        );
      }

      // 3️⃣ Barcha assignmentlarni tekshiramiz - overlap (ustma-ust tushish) bo'lmasligi kerak
      const allAssignments = await this.assignmentRepository.find({
        where: { user_id: userId },
        order: { effective_from: 'DESC' },
      });

      // 4️⃣ Overlap validatsiyasi - yangi assignment boshqa assignmentlar bilan ustma-ust tushmayotganini tekshiramiz
      const newStart = new Date(createAssignmentDto.effective_from);
      const newEnd = createAssignmentDto.effective_to
        ? new Date(createAssignmentDto.effective_to)
        : null; // null = hozircha davom etadi

      for (const existing of allAssignments) {
        const existingStart = new Date(existing.effective_from);
        const existingEnd = existing.effective_to
          ? new Date(existing.effective_to)
          : null;

        // Agar bir xil effective_from bo'lsa - keyinroq update qilamiz, hozir tekshirmasdan o'tamiz
        if (
          existingStart.toISOString().split('T')[0] ===
          newStart.toISOString().split('T')[0]
        ) {
          continue;
        }

        // Overlap tekshiruvi
        let hasOverlap = false;

        if (newEnd === null && existingEnd === null) {
          // Ikkala assignment ham "cheksiz" - har doim overlap
          hasOverlap = true;
        } else if (newEnd === null) {
          // Yangi assignment "cheksiz" - agar mavjud assignment yangi boshlanishdan keyin boshlanmasa overlap
          hasOverlap = existingEnd === null || existingEnd >= newStart;
        } else if (existingEnd === null) {
          // Mavjud assignment "cheksiz" - agar yangi assignment mavjud boshlanishdan oldin tugamasa overlap
          hasOverlap = newEnd >= existingStart;
        } else {
          // Ikkala assignment ham aniq muddatli - standart overlap tekshiruvi
          hasOverlap = newStart <= existingEnd && newEnd >= existingStart;
        }

        if (hasOverlap) {
          throw new BadRequestException(
            `Bu davr uchun allaqachon assignment mavjud. Mavjud assignment: ${existingStart.toISOString().split('T')[0]} dan ${existingEnd ? existingEnd.toISOString().split('T')[0] : 'hozir'} gacha. Iltimos, boshqa davr tanlang yoki mavjud assignmentni o'zgartiring.`,
          );
        }
      }

      // 5️⃣ Aktiv assignmentni topamiz (effective_to = null)
      // Agar yangi assignment hozirdan boshlanayotgan bo'lsa, eski aktiv assignmentni tugatamiz
      const activeAssignment = allAssignments.find(
        (a) => a.effective_to === null,
      );

      if (activeAssignment && newEnd === null) {
        // Agar yangi assignment ham "cheksiz" bo'lsa, eski aktiv assignmentni tugatish kerak
        const dayBeforeNewEffective = new Date(
          createAssignmentDto.effective_from,
        );
        dayBeforeNewEffective.setDate(dayBeforeNewEffective.getDate() - 1);
        activeAssignment.effective_to = dayBeforeNewEffective;
        await this.assignmentRepository.save(activeAssignment);
      }

      // 6️⃣ Bir xil effective_from bilan assignmentni tekshiramiz
      const existingAssignment = await this.assignmentRepository.findOne({
        where: {
          user_id: userId,
          effective_from: createAssignmentDto.effective_from,
        },
      });

      let savedAssignment: UserScheduleAssignment;

      if (existingAssignment) {
        // Agar mavjud bo'lsa - update qilamiz
        existingAssignment.default_template_id =
          createAssignmentDto.default_template_id;
        existingAssignment.effective_to = createAssignmentDto.effective_to;
        existingAssignment.exceptions = createAssignmentDto.exceptions;

        savedAssignment =
          await this.assignmentRepository.save(existingAssignment);
      } else {
        // Agar yo'q bo'lsa - yangi assignment yaratamiz
        const assignment = this.assignmentRepository.create({
          user_id: userId,
          default_template_id: createAssignmentDto.default_template_id,
          effective_from: createAssignmentDto.effective_from,
          effective_to: createAssignmentDto.effective_to,
          exceptions: createAssignmentDto.exceptions,
        });

        savedAssignment = await this.assignmentRepository.save(assignment);
      }

      createdAssignments.push(savedAssignment);
    }

    // Return single assignment if only one user, array if multiple
    return createdAssignments.length === 1
      ? createdAssignments[0]
      : createdAssignments;
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
   * Add schedule exception
   * If assignmentId is provided: adds to specific assignment
   * If assignmentId is null: adds to ALL active assignments (for company-wide holidays)
   * Can optionally filter by default_template_id
   */
  async addException(
    assignmentId: string | null,
    exception: CreateExceptionDto,
    actor: any,
  ): Promise<UserScheduleAssignment | UserScheduleAssignment[]> {
    // SCENARIO 1: Add exception to specific assignment
    if (assignmentId) {
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

    // SCENARIO 2: Add exception to ALL active assignments (company-wide holiday)
    // This is useful for national holidays like Navruz, New Year, etc.
    const whereCondition: any = {
      effective_to: IsNull(), // Only active assignments
    };

    // Filter by company (except SUPER_ADMIN)
    if (actor.role !== UserRole.SUPER_ADMIN) {
      // Get all users in the actor's company
      const companyUsers = await this.userRepository.find({
        where: { company_id: actor.company_id },
        select: ['id'],
      });

      const companyUserIds = companyUsers.map((u) => u.id);

      if (companyUserIds.length === 0) {
        throw new NotFoundException('No users found in your company');
      }

      whereCondition.user_id = In(companyUserIds);
    }

    // Optional: filter by specific template
    if (exception.default_template_id) {
      whereCondition.default_template_id = exception.default_template_id;
    }

    // Find all matching assignments
    const assignments = await this.assignmentRepository.find({
      where: whereCondition,
      relations: ['user'],
    });

    if (assignments.length === 0) {
      throw new NotFoundException(
        'No active assignments found matching the criteria',
      );
    }

    // Add exception to all found assignments
    const updatedAssignments: UserScheduleAssignment[] = [];

    for (const assignment of assignments) {
      // Initialize exceptions array if not exists
      if (!assignment.exceptions || !Array.isArray(assignment.exceptions)) {
        assignment.exceptions = [];
      }

      // Filter out any invalid entries (like empty arrays or non-objects)
      assignment.exceptions = assignment.exceptions.filter(
        (exc) => exc && typeof exc === 'object' && !Array.isArray(exc),
      );

      assignment.exceptions.push(exception);
      const saved = await this.assignmentRepository.save(assignment);
      updatedAssignments.push(saved);
    }

    console.log(
      `✅ Added exception to ${updatedAssignments.length} assignments`,
    );

    return updatedAssignments;
  }

  /**
   * Delete schedule exception — only from same company employee
   * Matches exception by type, date/date range, and template_id (if applicable)
   */
  async deleteException(
    assignmentId: string,
    exceptionToDelete: DeleteExceptionDto,
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
      throw new NotFoundException('No exceptions found for this assignment');
    }

    // Filter out any invalid entries (like empty arrays or non-objects)
    assignment.exceptions = assignment.exceptions.filter(
      (exc) => exc && typeof exc === 'object' && !Array.isArray(exc),
    );

    // Find and remove matching exception
    const initialLength = assignment.exceptions.length;

    assignment.exceptions = assignment.exceptions.filter((exc) => {
      // Type must match
      if (exc.type !== exceptionToDelete.type) {
        return true; // Keep this exception
      }

      // For single day exceptions, match by date
      if (exceptionToDelete.date) {
        return exc.date !== exceptionToDelete.date;
      }

      // For date range exceptions, match by start_date and end_date
      if (exceptionToDelete.start_date && exceptionToDelete.end_date) {
        if (
          exc.start_date !== exceptionToDelete.start_date ||
          exc.end_date !== exceptionToDelete.end_date
        ) {
          return true; // Keep this exception
        }
      } else {
        // If we're looking for a range but this exception doesn't have matching dates, keep it
        if (!exc.start_date || !exc.end_date) {
          return true; // Keep this exception
        }
      }

      // For ALTERNATE_TEMPLATE type, also match by template_id
      if (exceptionToDelete.type === 'ALTERNATE_TEMPLATE') {
        if (exc.template_id !== exceptionToDelete.template_id) {
          return true; // Keep this exception
        }
      }

      // All conditions matched, remove this exception
      return false;
    });

    // Check if any exception was actually removed
    if (assignment.exceptions.length === initialLength) {
      throw new NotFoundException(
        'Exception not found. Please check the provided parameters.',
      );
    }

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

    // 5️⃣ Overlap validatsiyasi - yangi assignment boshqa assignmentlar bilan ustma-ust tushmayotganini tekshiramiz
    const allAssignments = await this.assignmentRepository.find({
      where: { user_id: updateTemplateDto.user_id },
      order: { effective_from: 'DESC' },
    });

    const newStart = new Date(updateTemplateDto.effective_from);
    const newEnd = updateTemplateDto.effective_to
      ? new Date(updateTemplateDto.effective_to)
      : null;

    for (const existing of allAssignments) {
      // Skip the current assignment that we're about to close
      if (existing.assignment_id === currentAssignment.assignment_id) {
        continue;
      }

      const existingStart = new Date(existing.effective_from);
      const existingEnd = existing.effective_to
        ? new Date(existing.effective_to)
        : null;

      // Overlap tekshiruvi
      let hasOverlap = false;

      if (newEnd === null && existingEnd === null) {
        hasOverlap = true;
      } else if (newEnd === null) {
        hasOverlap = existingEnd === null || existingEnd >= newStart;
      } else if (existingEnd === null) {
        hasOverlap = newEnd >= existingStart;
      } else {
        hasOverlap = newStart <= existingEnd && newEnd >= existingStart;
      }

      if (hasOverlap) {
        throw new BadRequestException(
          `Bu davr uchun allaqachon assignment mavjud. Mavjud assignment: ${existingStart.toISOString().split('T')[0]} dan ${existingEnd ? existingEnd.toISOString().split('T')[0] : 'hozir'} gacha. Iltimos, boshqa davr tanlang yoki mavjud assignmentni o'zgartiring.`,
        );
      }
    }

    // 6️⃣ Eski assignmentni tugatamiz (effective_to ni o'rnatamiz)
    const dayBeforeNewEffective = new Date(updateTemplateDto.effective_from);
    dayBeforeNewEffective.setDate(dayBeforeNewEffective.getDate() - 1);
    currentAssignment.effective_to = dayBeforeNewEffective;
    await this.assignmentRepository.save(currentAssignment);

    // 7️⃣ Yangi assignment yaratamiz
    const newAssignment = this.assignmentRepository.create({
      user_id: updateTemplateDto.user_id,
      default_template_id: updateTemplateDto.new_template_id,
      effective_from: updateTemplateDto.effective_from,
      effective_to: updateTemplateDto.effective_to,
    });

    return await this.assignmentRepository.save(newAssignment);
  }

  /**
   * Bulk update schedule templates for multiple employees
   * Updates active assignments for all provided user IDs
   */
  async bulkUpdateTemplate(
    bulkUpdateDto: BulkUpdateAssignmentDto,
    actor: any,
  ): Promise<UserScheduleAssignment[]> {
    // Filter out empty strings and validate
    const userIds = bulkUpdateDto.user_id.filter(
      (id) => id && id.trim() !== '',
    );

    if (userIds.length === 0) {
      throw new BadRequestException('At least one valid user ID is required');
    }

    // Validate template_id
    if (
      !bulkUpdateDto.new_template_id ||
      bulkUpdateDto.new_template_id.trim() === ''
    ) {
      throw new BadRequestException('new_template_id cannot be empty');
    }

    const updatedAssignments: UserScheduleAssignment[] = [];

    for (const userId of userIds) {
      // Validate UUID format
      if (!userId || userId.trim() === '') {
        continue;
      }

      // 1️⃣ Xodimni topamiz
      const employee = await this.userRepository.findOne({
        where: { id: userId },
        select: ['id', 'company_id', 'first_name', 'last_name'],
      });

      if (!employee) {
        throw new NotFoundException(`Employee with ID ${userId} not found`);
      }

      // 2️⃣ SUPER_ADMIN bo'lmasa — faqat o'z company'ga tegishli xodimni o'zgartira oladi
      if (
        actor.role !== UserRole.SUPER_ADMIN &&
        employee.company_id !== actor.company_id
      ) {
        throw new ForbiddenException(
          `You can only update schedules for your own company employees (failed for user ${userId})`,
        );
      }

      // 3️⃣ Aktiv assignmentni topamiz (effective_to = null)
      // Bir user uchun faqat bitta aktiv template bo'lishi kerak
      const activeAssignment = await this.assignmentRepository.findOne({
        where: {
          user_id: userId,
          effective_to: IsNull(),
        },
        order: { effective_from: 'DESC' },
      });

      // 4️⃣ Agar aktiv assignment bo'lsa, faqat template ni almashtiramiz
      if (activeAssignment) {
        // Faqat template ni almashtiramiz, yangi assignment yaratmaymiz
        activeAssignment.default_template_id = bulkUpdateDto.new_template_id;
        const savedAssignment =
          await this.assignmentRepository.save(activeAssignment);
        updatedAssignments.push(savedAssignment);
      } else {
        // Agar aktiv assignment bo'lmasa, xatolik qaytaramiz
        throw new NotFoundException(
          `No active assignment found for user ${userId}. Please create an assignment first.`,
        );
      }
    }

    return updatedAssignments;
  }

  /**
   * Bulk delete schedule assignments for multiple employees
   * Can delete all assignments or only active assignments based on delete_all flag
   */
  async bulkDeleteAssignments(
    bulkDeleteDto: BulkDeleteAssignmentDto,
    actor: any,
  ): Promise<{
    deletedCount: number;
    userIds: string[];
    errors: string[];
    notFound: string[];
  }> {
    // Filter out empty strings and validate
    const userIds = bulkDeleteDto.user_id.filter(
      (id) => id && id.trim() !== '',
    );

    if (userIds.length === 0) {
      throw new BadRequestException('At least one valid user ID is required');
    }

    const deletedUserIds: string[] = [];
    const errors: string[] = [];
    const notFound: string[] = [];
    let totalDeleted = 0;

    for (const userId of userIds) {
      // Validate UUID format
      if (!userId || userId.trim() === '') {
        continue;
      }
      try {
        // 1️⃣ Xodimni topamiz
        const employee = await this.userRepository.findOne({
          where: { id: userId },
          select: ['id', 'company_id'],
        });

        if (!employee) {
          errors.push(`Employee with ID ${userId} not found`);
          notFound.push(userId);
          continue;
        }

        // 2️⃣ SUPER_ADMIN bo'lmasa — faqat o'z company'ga tegishli xodimni o'chira oladi
        if (
          actor.role !== UserRole.SUPER_ADMIN &&
          employee.company_id !== actor.company_id
        ) {
          errors.push(
            `You can only delete schedules for your own company employees (failed for user ${userId})`,
          );
          continue;
        }

        // 3️⃣ Assignmentlarni topamiz va o'chiramiz
        // Agar delete_all false bo'lsa, faqat aktiv assignmentlarni o'chiramiz
        // Aks holda (undefined yoki true), barcha assignmentlarni o'chiramiz
        if (bulkDeleteDto.delete_all === false) {
          // Delete only active assignments (effective_to = null)
          // First check if there are any active assignments
          const activeAssignments = await this.assignmentRepository.find({
            where: {
              user_id: userId,
              effective_to: IsNull(),
            },
          });

          if (activeAssignments.length === 0) {
            errors.push(
              `No active assignments found for user ${userId} (effective_to is null)`,
            );
            continue;
          }

          const result = await this.assignmentRepository.delete({
            user_id: userId,
            effective_to: IsNull(),
          });

          if (result.affected && result.affected > 0) {
            totalDeleted += result.affected;
            deletedUserIds.push(userId);
          } else {
            errors.push(
              `Failed to delete active assignments for user ${userId}`,
            );
          }
        } else {
          // Delete all assignments for this user (default behavior)
          const result = await this.assignmentRepository.delete({
            user_id: userId,
          });
          if (result.affected && result.affected > 0) {
            totalDeleted += result.affected;
            deletedUserIds.push(userId);
          } else {
            errors.push(`No assignments found to delete for user ${userId}`);
          }
        }
      } catch (error) {
        errors.push(`Error processing user ${userId}: ${error.message}`);
      }
    }

    return {
      deletedCount: totalDeleted,
      userIds: deletedUserIds,
      errors: errors,
      notFound: notFound,
    };
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
