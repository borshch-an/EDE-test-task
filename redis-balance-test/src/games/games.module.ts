import { Module } from '@nestjs/common';
import { GamesController } from './games.controller';
import { AllInGameModule } from '../all-in-game/all-in-game.module';
import { BalanceModule } from '../balance/balance.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    AllInGameModule,
    BalanceModule,
    TransactionsModule,
    UsersModule,
  ],
  controllers: [GamesController],
})
export class GamesModule {}
