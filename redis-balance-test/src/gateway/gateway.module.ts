import { Module } from '@nestjs/common';
import { BalanceGateway } from './balance.gateway';

@Module({
  providers: [BalanceGateway],
})
export class GatewayModule {}
