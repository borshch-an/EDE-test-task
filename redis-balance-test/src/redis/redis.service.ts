import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('redis.host');
    const port = this.configService.get<number>('redis.port');
    const password = this.configService.get<string>('redis.password');

    this.client = new Redis({
      host,
      port,
      password,
      lazyConnect: true,
    });

    this.client.on('connect', () => this.logger.log('Redis connected successfully'));
    this.client.on('error', (err) => this.logger.error('Redis error occurred:', err));
  }

  async onModuleInit() {
    try {
      await this.client.connect();
    } catch (err) {
      this.logger.error('Failed to connect to Redis during bootstrap', err);
    }
  }

  async onModuleDestroy() {
    await this.client.quit();
    this.logger.log('Redis connection closed gracefully');
  }

  // Get raw Redis client instance if low-level operations are needed
  getClient(): Redis {
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string): Promise<string> {
    return this.client.set(key, value);
  }

  async incrbyfloat(key: string, value: number): Promise<number> {
    const result = await this.client.incrbyfloat(key, value);
    return parseFloat(result);
  }

  async lpush(key: string, value: string): Promise<number> {
    return this.client.lpush(key, value);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.client.lrange(key, start, stop);
  }

  // Set key with NX + EX atomically. Returns true if key was newly created.
  // Used for idempotency: if the key already exists (tx already processed), returns false.
  async setNxEx(key: string, ttlSeconds: number, value: string): Promise<boolean> {
    const result = await this.client.set(key, value, 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }
}

