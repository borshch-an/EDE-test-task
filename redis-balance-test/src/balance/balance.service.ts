import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class BalanceService {
  private readonly logger = new Logger(BalanceService.name);
  private readonly DEFAULT_BALANCE = 1000.00;

  constructor(
    private readonly redisService: RedisService,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  private getBalanceKey(userId: string): string {
    return `balance:${userId}`;
  }

  async getBalance(userId: string): Promise<number> {
    const key = this.getBalanceKey(userId);
    const balanceStr = await this.redisService.get(key);

    if (balanceStr === null) {
      // Initialize with default balance if not present in Redis
      await this.redisService.set(key, this.DEFAULT_BALANCE.toString());
      return this.DEFAULT_BALANCE;
    }

    return parseFloat(balanceStr);
  }

  async increment(userId: string, amount: number): Promise<number> {
    if (amount <= 0) {
      throw new BadRequestException('Increment amount must be greater than zero');
    }

    const key = this.getBalanceKey(userId);

    await this.getBalance(userId);

    const newBalance = await this.redisService.incrbyfloat(key, amount);
    this.logger.log(`Incremented balance for user ${userId} by ${amount}. New balance: ${newBalance}`);

    this.eventEmitter.emit('balance.updated', { userId, balance: newBalance });

    return newBalance;
  }

  async decrement(userId: string, amount: number): Promise<number> {
    if (amount <= 0) {
      throw new BadRequestException('Decrement amount must be greater than zero');
    }

    const key = this.getBalanceKey(userId);
    const currentBalance = await this.getBalance(userId);

    if (currentBalance < amount) {
      throw new BadRequestException(`Insufficient balance. Current: ${currentBalance}, Required: ${amount}`);
    }

    // Atomically decrement by passing negative value to incrbyfloat
    const newBalance = await this.redisService.incrbyfloat(key, -amount);

    // Safety check in case of concurrent decrements violating the initial check
    if (newBalance < 0) {
      await this.redisService.incrbyfloat(key, amount);
      throw new BadRequestException('Insufficient balance due to concurrent transaction');
    }

    this.logger.log(`Decremented balance for user ${userId} by ${amount}. New balance: ${newBalance}`);

    this.eventEmitter.emit('balance.updated', { userId, balance: newBalance });

    return newBalance;
  }
}
