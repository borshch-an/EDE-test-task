import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { BalanceService } from '../balance/balance.service';
import { TransactionsService } from '../transactions/transactions.service';
import { UsersService } from '../users/users.service';
import { CallbackException } from './exceptions/callback.exception';
import { Transaction } from 'src/transactions/transaction.interface';

// Idempotency TTL: 48 hours in seconds
const IDEMPOTENCY_TTL = 172800;

@Injectable()
export class CallbackService {
  private readonly logger = new Logger(CallbackService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly balanceService: BalanceService,
    private readonly transactionsService: TransactionsService,
    private readonly usersService: UsersService,
  ) { }

  private idempotencyKey(transactionId: string): string {
    return `tx_processed:${transactionId}`;
  }

  /**
   * Returns true if the transactionId has already been processed.
   * Atomically marks the transactionId as processing using SET NX EX.
   * Returns false (and sets key) if this is the first time seeing this transactionId.
   */
  private async checkAndMarkIdempotency(transactionId: string): Promise<boolean> {
    const key = this.idempotencyKey(transactionId);
    // setNxEx returns true if key was NEWLY set (first time), false if key already existed
    const isNew = await this.redisService.setNxEx(key, IDEMPOTENCY_TTL, 'processed');
    return !isNew; // true = already processed (duplicate)
  }

  private async assertUserExists(userId: string): Promise<void> {
    const exists = await this.usersService.exists(userId);
    if (!exists) {
      throw new CallbackException('USER_NOT_FOUND', `User ${userId} not found`);
    }
  }

  async getBalance(userId: string): Promise<{ userId: string; balance: number }> {
    await this.assertUserExists(userId);
    const balance = await this.balanceService.getBalance(userId);
    this.logger.log(`Balance callback for user ${userId}: ${balance}`);
    return { userId, balance };
  }

  async processBet(
    userId: string,
    gameId: string,
    transactionId: string,
    betAmount: number,
  ): Promise<{ action_id: string; tx_id: string; processed_at: string } | { transactionId: string; balance: number }> {
    await this.assertUserExists(userId);

    // Idempotency: if already processed, return current balance without re-applying
    const isDuplicate = await this.checkAndMarkIdempotency(transactionId);
    if (isDuplicate) {
      this.logger.warn(`Duplicate bet callback received: transactionId=${transactionId}`);
      const balance = await this.balanceService.getBalance(userId);
      return { transactionId, balance };
    }

    const currentBalance = await this.balanceService.getBalance(userId);
    if (currentBalance < betAmount) {
      // Remove the idempotency key so the aggregator can retry after a top-up
      await this.redisService.setNxEx(this.idempotencyKey(transactionId), 1, 'failed');
      throw new CallbackException(
        '412',
        'HTTP 412 Precondition Failed',
      );
    }

    const newBalance = await this.balanceService.decrement(userId, betAmount);
    const tx = await this.transactionsService.record(userId, betAmount, transactionId, gameId);

    this.logger.log(
      `Bet processed: user=${userId} game=${gameId} amount=${betAmount} newBalance=${newBalance}`,
    );
    return { action_id: transactionId, tx_id: tx.id, processed_at: tx.timestamp };
  }


  async processWin(
    userId: string,
    gameId: string,
    transactionId: string,
    winAmount: number,
  ): Promise<{ action_id: string; tx_id: string; processed_at: string } | { transactionId: string; balance: number }> {
    await this.assertUserExists(userId);

    const isDuplicate = await this.checkAndMarkIdempotency(transactionId);
    if (isDuplicate) {
      this.logger.warn(`Duplicate win callback received: transactionId=${transactionId}`);
      const balance = await this.balanceService.getBalance(userId);
      return { transactionId, balance };
    }

    // Win of 0 is a valid "no win" round — credit nothing but still respond
    let newBalance: number;
    let tx: Transaction;
    if (winAmount > 0) {
      newBalance = await this.balanceService.increment(userId, winAmount);
      tx = await this.transactionsService.record(userId, winAmount, transactionId, gameId);
    } else {
      newBalance = await this.balanceService.getBalance(userId);
      tx = await this.transactionsService.record(userId, 0, transactionId, gameId);
    }

    this.logger.log(
      `Win processed: user=${userId} game=${gameId} amount=${winAmount} newBalance=${newBalance}`,
    );
    return { action_id: transactionId, tx_id: tx.id, processed_at: tx.timestamp };
  }


  async processRollback(
    userId: string,
    gameId: string,
    transactionId: string,
    originalTransactionId: string,
  ): Promise<{ transactionId: string; balance: number }> {
    await this.assertUserExists(userId);

    const isDuplicate = await this.checkAndMarkIdempotency(transactionId);
    if (isDuplicate) {
      this.logger.warn(`Duplicate rollback callback received: transactionId=${transactionId}`);
      const balance = await this.balanceService.getBalance(userId);
      return { transactionId, balance };
    }

    // Check if the original bet was ever processed
    const originalProcessed = await this.redisService.exists(
      this.idempotencyKey(originalTransactionId),
    );

    if (!originalProcessed) {
      // Original bet was never applied — nothing to refund, just ACK
      this.logger.warn(
        `Rollback for unprocessed bet: originalTxId=${originalTransactionId}. Returning current balance.`,
      );
      const balance = await this.balanceService.getBalance(userId);
      return { transactionId, balance };
    }

    const history = await this.transactionsService.getHistory(userId);
    const originalTx = history.find((tx) => tx.gameId === gameId && tx.action_id === originalTransactionId);

    if (!originalTx) {
      this.logger.warn(
        `Could not find original debit for rollback: user=${userId} game=${gameId} originalTxId=${originalTransactionId}`,
      );
      const balance = await this.balanceService.getBalance(userId);
      return { transactionId, balance };
    }

    const newBalance = await this.balanceService.increment(userId, originalTx.amount);
    await this.transactionsService.record(userId, originalTx.amount, transactionId, gameId);

    this.logger.log(
      `Rollback processed: user=${userId} game=${gameId} refunded=${originalTx.amount} newBalance=${newBalance}`,
    );
    return { transactionId, balance: newBalance };
  }
}
