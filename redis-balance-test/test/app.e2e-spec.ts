import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as express from 'express';
import { AppModule } from './../src/app.module';
import { AllInGameService } from './../src/all-in-game/all-in-game.service';

describe('Public API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.ALLINGAME_PRIVATE_KEY = 'test-secret';
    process.env.ALLINGAME_API_TOKEN = 'test-secret';

    const fakeAllInGame = {
      getGames: async () => [{ id: 'g1', title: 'G1' }],
      startSession: async () => 'https://example.com/session',
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AllInGameService)
      .useValue(fakeAllInGame)
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(express.json({ verify: (req: any, _res, buf) => { req.rawBody = buf.toString(); } }));
    await app.init();

    // Clear Redis to ensure clean e2e state
    const redisService = moduleFixture.get(require('../src/redis/redis.service').RedisService);
    try {
      await redisService.getClient().flushdb();
    } catch (err) {
      // ignore flush errors (e.g., Redis not available)
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /games -> 200 and response defined', async () => {
    const res = await request(app.getHttpServer()).get('/games').expect(200);
    expect(res.body).toBeDefined();
  });

  it('GET /me -> 200 and response defined', async () => {
    const res = await request(app.getHttpServer()).get('/me').query({ userId: 'user-1' }).expect(200);
    expect(res.body).toBeDefined();
  });

  it('POST /games -> 200 and contains url', async () => {
    const payload = {
      game_id: 58322,
      currency: 'TRY',
      locale: "en",
      ip: '188.168.3.5',
      client_type: 'desktop',
      url: {
        return_url: 'https://example.com',
        deposit_url: 'https://example.com',
      },
      user: {
        country: 'TK',
        firstname: 'Firstname',
        lastname: 'Lastname',
        user_id: 'user-1',
        nickname: 'username',
        city: 'Ankara',
        date_of_birth: '1995-08-03',
        registred_at: '2024-05-19',
        gender: 'm'
      }
    };

    const res = await request(app.getHttpServer()).post('/games/start').send(payload).expect(201);
    expect(res.text).toContain('https://example.com/session');
  });

  it('GET /transactions -> 200 and returns array', async () => {
    const res = await request(app.getHttpServer()).get('/transactions').query({ userId: 'user-1' }).expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
