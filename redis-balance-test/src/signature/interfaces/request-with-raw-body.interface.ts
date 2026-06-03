import { Request } from 'express';

/**
 * Extends the Express Request interface to include rawBody,
 * which is populated by the rawBody option in NestFactory.create().
 */
export interface RequestWithRawBody extends Request {
  rawBody: string;
}
