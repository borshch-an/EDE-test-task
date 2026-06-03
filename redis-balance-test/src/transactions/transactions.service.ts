import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { UsersService } from '../users/users.service';
import { Transaction } from './transaction.interface';
import * as crypto from 'crypto';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly usersService: UsersService,
  ) { }

  private getTransactionsKey(userId: string): string {
    return `transactions:${userId}`;
  }

  async record(
    userId: string,
    amount: number,
    action_id: string,
    gameId?: string,
  ): Promise<Transaction> {
    const userExists = await this.usersService.exists(userId);
    if (!userExists) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const transaction: Transaction = {
      id: crypto.randomUUID(),
      userId,
      amount,
      gameId,
      timestamp: new Date().toISOString(),
      action_id,
    };

    const key = this.getTransactionsKey(userId);
    await this.redisService.lpush(key, JSON.stringify(transaction));

    this.logger.log(`Recorded transaction ${transaction.id} for user ${userId}`);
    return transaction;
  }

  async getHistory(userId: string): Promise<Transaction[]> {
    const userExists = await this.usersService.exists(userId);
    if (!userExists) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const key = this.getTransactionsKey(userId);
    const rawTransactions = await this.redisService.lrange(key, 0, -1);

    return rawTransactions.map((txStr) => JSON.parse(txStr) as Transaction);
  }
}
