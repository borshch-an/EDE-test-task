import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { AllInGameService } from './all-in-game.service';
import { SignatureModule } from 'src/signature/signature.module';

@Module({
  imports: [
    HttpModule,
    CacheModule.register(),
    SignatureModule
  ],
  providers: [AllInGameService],
  exports: [AllInGameService],
})
export class AllInGameModule { }
