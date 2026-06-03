import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { CallbackException } from './exceptions/callback.exception';

@Catch(CallbackException)
export class CallbackExceptionFilter implements ExceptionFilter {
  catch(exception: CallbackException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception.getStatus ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const errorResponse = {
      error: exception.message,
      requestId: request.headers['x-request-id'] || null,
      timestamp: new Date().toISOString(),
    };
    response.status(status).json(errorResponse);
  }
}
