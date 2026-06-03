import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import { RedisModule } from './redis/redis.module';
import { UsersModule } from './users/users.module';
import { BalanceModule } from './balance/balance.module';
import { TransactionsModule } from './transactions/transactions.module';
import { AllInGameModule } from './all-in-game/all-in-game.module';
import { GamesModule } from './games/games.module';
import { GatewayModule } from './gateway/gateway.module';
import { CallbackModule } from './callback/callback.module';
import { APP_GUARD } from '@nestjs/core';
import { SignatureGuard } from './signature/signature.guard';
import { SignatureModule } from './signature/signature.module';
import { MeModule } from './me/me.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    EventEmitterModule.forRoot(),
    RedisModule,
    UsersModule,
    BalanceModule,
    TransactionsModule,
    AllInGameModule,
    GamesModule,
    GatewayModule,
    SignatureModule,
    MeModule,
    CallbackModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
  ],
})
export class AppModule { }









