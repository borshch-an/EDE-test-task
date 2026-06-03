import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Domain‑specific exception used by the Seamless Wallet callback flow.
 * `code` represents an aggregator‑specific error identifier.
 */
export class CallbackException extends HttpException {
  constructor(public readonly code: string, message: string) {
    // Use 400 Bad Request for most business errors; callers can map `code`.
    super({ errorCode: code, message }, HttpStatus.BAD_REQUEST);
  }
}
