import * as crypto from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SignatureService {
  private readonly secretKey: string;

  constructor(private readonly configService: ConfigService) {
    this.secretKey =
      process.env.ALLINGAME_PRIVATE_KEY ||
      process.env.ALLINGAME_API_TOKEN ||
      this.configService.get<string>('allInGame.apiToken') ||
      '';
  }

  generateSignature(payload: string): string {
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(payload)
      .digest('hex');
  }

  verifySignature(payload: string, signature: string): boolean {
    const expected = this.generateSignature(payload);
    const expectedBuf = Buffer.from(expected, 'hex');
    const receivedBuf = Buffer.from(signature, 'hex');

    // Guard against buffers of different lengths — timingSafeEqual requires equal lengths
    if (expectedBuf.length !== receivedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, receivedBuf);
  }
}
