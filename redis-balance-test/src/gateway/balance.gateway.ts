import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class BalanceGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(BalanceGateway.name);

  @OnEvent('balance.updated')
  handleBalanceUpdatedEvent(payload: { userId: string; balance: number }) {
    this.logger.log(
      `Broadcasting real-time balance update for user ${payload.userId}: ${payload.balance}`,
    );
    
    // Broadcast the update globally to all connected clients
    this.server.emit('balance:update', payload);
  }
}
