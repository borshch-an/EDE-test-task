import { Module } from '@nestjs/common';
import { MeController } from './me.controller';
import { UsersModule } from '../users/users.module';
import { BalanceModule } from '../balance/balance.module';

@Module({
  imports: [UsersModule, BalanceModule],
  controllers: [MeController],
})
export class MeModule {}
