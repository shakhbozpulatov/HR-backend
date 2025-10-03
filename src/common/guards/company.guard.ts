import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@/modules/users/entities/user.entity';

@Injectable()
export class CompanyGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // SUPER_ADMIN can access everything
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Extract company_id from request (params, query, or body)
    const companyId =
      request.params.company_id ||
      request.params.id ||
      request.query.company_id ||
      request.body.company_id;

    // If company_id exists, validate user has access
    if (companyId && user.company_id !== companyId) {
      throw new ForbiddenException('Access denied to this company');
    }

    return true;
  }
}
