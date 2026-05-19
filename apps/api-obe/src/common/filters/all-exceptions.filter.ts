import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
  details?: unknown;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = this.extractMessage(exception, status);
    const error = this.extractErrorName(exception, status);
    const details = this.extractDetails(exception);

    const errorResponse: ErrorResponse = {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (details && Object.keys(details).length > 0) {
      errorResponse.details = details;
    }

    this.logger.error(
      `${request.method} ${request.url} - ${status}: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      success: false,
      ...errorResponse,
    });
  }

  private extractMessage(exception: unknown, status: number): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') {
        return response;
      }
      if (typeof response === 'object' && response !== null) {
        const msg = (response as Record<string, unknown>).message;
        if (Array.isArray(msg)) {
          return msg.join(', ');
        }
        if (typeof msg === 'string') {
          return msg;
        }
      }
      return exception.message;
    }

    if (exception instanceof Error) {
      if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
        return 'Internal server error';
      }
      return exception.message;
    }

    return 'Unknown error occurred';
  }

  private extractErrorName(exception: unknown, status: number): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'object' && response !== null) {
        const error = (response as Record<string, unknown>).error;
        if (typeof error === 'string') {
          return error;
        }
      }
      return exception.name;
    }

    if (status === HttpStatus.NOT_FOUND) return 'Not Found';
    if (status === HttpStatus.BAD_REQUEST) return 'Bad Request';
    if (status === HttpStatus.UNAUTHORIZED) return 'Unauthorized';
    if (status === HttpStatus.FORBIDDEN) return 'Forbidden';
    if (status === HttpStatus.CONFLICT) return 'Conflict';
    if (status === HttpStatus.UNPROCESSABLE_ENTITY) return 'Unprocessable Entity';

    return 'Internal Server Error';
  }

  private extractDetails(exception: unknown): Record<string, unknown> | undefined {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'object' && response !== null) {
        const { statusCode, message, error, ...rest } = response as Record<string, unknown>;
        return Object.keys(rest).length > 0 ? rest : undefined;
      }
    }
    return undefined;
  }
}
