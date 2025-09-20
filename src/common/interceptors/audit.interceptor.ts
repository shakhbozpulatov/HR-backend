import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../modules/audit/audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, body } = request;

    // Only audit mutations (POST, PUT, PATCH, DELETE)
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (response) => {
          // Log successful operations
          if (user && this.shouldAudit(url)) {
            this.auditService
              .logHttpRequest({
                actor: user.user_id || user.email,
                method,
                url,
                body,
                response,
                duration: Date.now() - startTime,
                status: 'success',
              })
              .catch((err) => console.error('Audit logging failed:', err));
          }
        },
        error: (error) => {
          // Log failed operations
          if (user && this.shouldAudit(url)) {
            this.auditService
              .logHttpRequest({
                actor: user.user_id || user.email,
                method,
                url,
                body,
                error: error.message,
                duration: Date.now() - startTime,
                status: 'error',
              })
              .catch((err) => console.error('Audit logging failed:', err));
          }
        },
      }),
    );
  }

  private shouldAudit(url: string): boolean {
    // Skip audit for certain endpoints
    const skipPatterns = [
      '/auth/login',
      '/auth/refresh',
      '/health',
      '/metrics',
    ];

    return !skipPatterns.some((pattern) => url.includes(pattern));
  }
}
