import { Module } from '@nestjs/common';
import { SignatureService } from './signature.service';
import { SignatureGuard } from './signature.guard';

@Module({
  providers: [SignatureService, SignatureGuard],
  exports: [SignatureGuard, SignatureService],
})
export class SignatureModule { }
