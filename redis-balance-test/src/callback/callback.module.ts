import { Module } from '@nestjs/common';
import { CallbackController } from './callback.controller';
import { CallbackService } from './callback.service';
import { CallbackExceptionFilter } from './callback.exception.filter';
import { APP_FILTER } from '@nestjs/core';
import { BalanceModule } from 'src/balance/balance.module';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { UsersModule } from 'src/users/users.module';
import { SignatureModule } from 'src/signature/signature.module';

@Module({
  imports: [BalanceModule, TransactionsModule, UsersModule, SignatureModule],
  controllers: [CallbackController],
  providers: [
    CallbackService,
    {
      provide: APP_FILTER,
      useClass: CallbackExceptionFilter,
    },
  ],
})
export class CallbackModule { }
