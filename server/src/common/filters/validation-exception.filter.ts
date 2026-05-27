import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

interface ValidationErrorBody {
  message?: string | string[];
  errors?: Record<string, string | Record<string, string>>;
}

/**
 * Converts class-validator BadRequestException payloads into the contract
 * the frontend expects: { errors: { fieldName: 'message' | { hy:'...' } } }.
 *
 * Other HttpExceptions pass through with their existing payload.
 */
@Catch(HttpException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const status = exception.getStatus();
    const payload = exception.getResponse();

    if (exception instanceof BadRequestException && typeof payload === 'object' && payload) {
      const body = payload as ValidationErrorBody;
      // If a controller has already shaped { errors }, pass through
      if (body.errors) {
        return res.status(status).json({ errors: body.errors });
      }
      // class-validator default: { message: ['name must not be empty', ...] }
      if (Array.isArray(body.message)) {
        const errors: Record<string, string> = {};
        for (const m of body.message) {
          const [field] = m.split(' ');
          if (field) errors[field] = m;
        }
        return res.status(status).json({ errors });
      }
    }

    if (typeof payload === 'object' && payload !== null) {
      return res.status(status).json(payload);
    }
    return res.status(status).json({
      message:
        typeof payload === 'string'
          ? payload
          : exception.message ?? HttpStatus[status],
    });
  }
}
