import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user } = request;

    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          if (user && this.shouldAudit(url)) {
            console.log(
              `[AUDIT] ${user.email} - ${method} ${url} - Success - ${Date.now() - startTime}ms`,
            );
          }
        },
        error: (error) => {
          if (user && this.shouldAudit(url)) {
            console.log(
              `[AUDIT] ${user.email} - ${method} ${url} - Error: ${error.message} - ${Date.now() - startTime}ms`,
            );
          }
        },
      }),
    );
  }

  private shouldAudit(url: string): boolean {
    const skipPatterns = ['/auth/login', '/auth/refresh', '/health'];
    return !skipPatterns.some((pattern) => url.includes(pattern));
  }
}
