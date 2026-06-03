import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { SignatureService } from './signature.service';
import { RequestWithRawBody } from './interfaces/request-with-raw-body.interface';

@Injectable()
export class SignatureGuard implements CanActivate {
  constructor(private readonly signatureService: SignatureService) { }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithRawBody>();
    const signature = request.headers['x-request-sign'] as string;
    if (!signature) {
      throw new ForbiddenException('Missing signature header');
    }
    const rawBody = request.rawBody ?? request.body;
    const payloadString = typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody);

    const valid = this.signatureService.verifySignature(payloadString, signature);
    if (!valid) {
      throw new ForbiddenException('Invalid request signature');
    }
    return true;
  }
}
