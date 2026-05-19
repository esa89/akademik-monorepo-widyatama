import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
  timestamp: string;
  path: string;
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const statusCode = context.switchToHttp().getResponse().statusCode;

    return next.handle().pipe(
      map((data: unknown) => {
        if (
          data !== null &&
          typeof data === 'object' &&
          'success' in data &&
          'data' in data
        ) {
          return data as ApiResponse<T>;
        }

        const response: ApiResponse<T> = {
          success: true,
          statusCode,
          message: 'Success',
          data: data as T,
          timestamp: new Date().toISOString(),
          path: request.url,
        };

        if (
          data !== null &&
          typeof data === 'object' &&
          'meta' in data &&
          (data as Record<string, unknown>).meta !== undefined
        ) {
          response.meta = (data as Record<string, unknown>).meta as Record<string, unknown>;
          response.data = (data as Record<string, unknown>).data as T;
        }

        return response;
      }),
    );
  }
}
