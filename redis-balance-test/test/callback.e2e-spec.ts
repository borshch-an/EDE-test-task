import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as express from 'express';
import * as crypto from 'crypto';
import { AppModule } from './../src/app.module';

describe('Callback API (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        process.env.ALLINGAME_PRIVATE_KEY = 'test-secret';
        process.env.ALLINGAME_API_TOKEN = 'test-secret';

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.use(express.json({ verify: (req: any, _res, buf) => { req.rawBody = buf.toString(); } }));
        await app.init();

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

    const sign = (payload: any) =>
        crypto.createHmac('sha256', process.env.ALLINGAME_PRIVATE_KEY || '').update(JSON.stringify(payload)).digest('hex');

    it('security: valid signature -> 200', async () => {
        const payload = { user_id: 'user-1', game: 'spaceman', game_id: 'spaceman', currency: 'USD', gameId: 'spaceman', actions: [{ action: 'win', amount: 0, action_id: 'sig-1' }] };
        const sig = sign(payload);
        await request(app.getHttpServer()).post('/callback/play').set('X-REQUEST-SIGN', sig).send(payload).expect(200);
    });

    it('security: invalid signature -> 403', async () => {
        const payload = { user_id: 'user-1', game: 'spaceman', game_id: 'spaceman', currency: 'USD', gameId: 'spaceman', actions: [{ action: 'win', amount: 0, action_id: 'sig-2' }] };
        await request(app.getHttpServer()).post('/callback/play').set('X-REQUEST-SIGN', 'bad').send(payload).expect(403);
    });

    it('security: missing signature -> 403', async () => {
        const payload = { user_id: 'user-1', game: 'spaceman', game_id: 'spaceman', currency: 'USD', gameId: 'spaceman', actions: [{ action: 'win', amount: 0, action_id: 'sig-3' }] };
        await request(app.getHttpServer()).post('/callback/play').send(payload).expect(403);
    });

    it('debit (bet): balance decreases and transaction created', async () => {
        const balRes = await request(app.getHttpServer()).post('/callback/balance').send({ userId: 'user-1', gameId: 'spaceman' }).expect(200);
        const initial = balRes.body.balance;

        // use paired actions (bet + no-win) so controller's combined path is used
        const payload = {
            user_id: 'user-1', game: 'spaceman', game_id: 'spaceman', currency: 'USD', gameId: 'spaceman', actions: [
                { action: 'bet', amount: 10, action_id: 'tx-bet-1' },
                { action: 'win', amount: 0, action_id: 'tx-win-1' }
            ]
        };
        const sig = sign(payload);
        await request(app.getHttpServer()).post('/callback/play').set('X-REQUEST-SIGN', sig).send(payload).expect(200);

        const balRes2 = await request(app.getHttpServer()).post('/callback/balance').send({ userId: 'user-1', gameId: 'spaceman' }).expect(200);
        const after = balRes2.body.balance;
        expect(after).toBe(initial - 10);

        const txs = await request(app.getHttpServer()).get('/transactions').query({ userId: 'user-1' }).expect(200);
        expect(Array.isArray(txs.body)).toBe(true);
        expect(txs.body.length > 0).toBe(true);
    });

    it('credit (win): balance increases and transaction created', async () => {
        const balRes = await request(app.getHttpServer()).post('/callback/balance').send({ userId: 'user-1', gameId: 'spaceman' }).expect(200);
        const before = balRes.body.balance;

        // single action win (credit)
        const payload = { user_id: 'user-1', game: 'spaceman', game_id: 'spaceman', currency: 'USD', gameId: 'spaceman', actions: [{ action: 'win', amount: 5, action_id: 'tx-win-2' }] };
        const sig = sign(payload);
        await request(app.getHttpServer()).post('/callback/play').set('X-REQUEST-SIGN', sig).send(payload).expect(200);

        const balRes2 = await request(app.getHttpServer()).post('/callback/balance').send({ userId: 'user-1', gameId: 'spaceman' }).expect(200);
        const after = balRes2.body.balance;
        expect(after).toBe(before + 5);

        const txs = await request(app.getHttpServer()).get('/transactions').query({ userId: 'user-1' }).expect(200);
        expect(Array.isArray(txs.body)).toBe(true);
        expect(txs.body.length > 0).toBe(true);
    });

    it('rollback: balance restored and transaction created', async () => {
        const balRes = await request(app.getHttpServer()).post('/callback/balance').send({ userId: 'user-1', gameId: 'spaceman' }).expect(200);
        const initial = balRes.body.balance;

        // create a bet to rollback
        // create a bet (paired with a zero-win) so the controller records the bet
        const betPayload = {
            user_id: 'user-1', game: 'spaceman', game_id: 'spaceman', currency: 'USD', gameId: 'spaceman', actions: [
                { action: 'bet', amount: 7, action_id: 'tx-bet-rollback' },
                { action: 'win', amount: 0, action_id: 'tx-bet-rollback-win' }
            ]
        };
        const sigBet = sign(betPayload);
        await request(app.getHttpServer()).post('/callback/play').set('X-REQUEST-SIGN', sigBet).send(betPayload).expect(200);

        const afterBet = await request(app.getHttpServer()).post('/callback/balance').send({ userId: 'user-1', gameId: 'spaceman' }).expect(200);
        const betBalance = afterBet.body.balance;

        const rollbackPayload = { user_id: 'user-1', game_id: 'spaceman', currency: 'USD', actions: [{ action: 'rollback', action_id: 'tx-rollback-1', original_action_id: 'tx-bet-rollback' }] };
        const sigRollback = sign(rollbackPayload);
        await request(app.getHttpServer()).post('/callback/rollback').set('X-REQUEST-SIGN', sigRollback).send(rollbackPayload).expect(200);

        const afterRollback = await request(app.getHttpServer()).post('/callback/balance').send({ userId: 'user-1', gameId: 'spaceman' }).expect(200);
        const finalBalance = afterRollback.body.balance;
        expect(finalBalance).toBe(initial);

        const txs = await request(app.getHttpServer()).get('/transactions').query({ userId: 'user-1' }).expect(200);
        expect(Array.isArray(txs.body)).toBe(true);
        expect(txs.body.length > 0).toBe(true);
    });
});
