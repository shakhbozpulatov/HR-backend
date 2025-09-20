import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => {
        if (
          data &&
          typeof data === 'object' &&
          data.data &&
          data.total !== undefined
        ) {
          // Paginated response
          const { data: items, total, page = 1, limit = 10 } = data;
          return {
            success: true,
            data: items,
            pagination: {
              page: Number(page),
              limit: Number(limit),
              total: Number(total),
              pages: Math.ceil(total / limit),
            },
          };
        }

        return {
          success: true,
          data,
        };
      }),
    );
  }
}
