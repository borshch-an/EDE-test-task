import { Injectable, Logger, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Game } from './game.interface';
import { StartSessionDto } from 'src/games/dto/start-game.dto';
import { SignatureService } from 'src/signature/signature.service';

@Injectable()
export class AllInGameService {
  private readonly logger = new Logger(AllInGameService.name);
  private readonly apiUrl: string;
  private readonly apiToken: string;
  private readonly cacheTtl: number;
  private readonly authKey: string;

  private readonly mockGames: Game[] = [
    { id: 'spaceman', title: 'Spaceman Crash', category: 'Crash', imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80' },
    { id: 'diamonds', title: 'Diamond Slots', category: 'Slots', imageUrl: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=400&q=80' },
    { id: 'roulette', title: 'European Roulette', category: 'Table', imageUrl: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?auto=format&fit=crop&w=400&q=80' },
  ];

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly signatureService: SignatureService,
  ) {
    this.apiUrl = this.configService.get<string>('ALLINGAME_API_URL') || 'https://api.all-ingame.example.com';
    this.apiToken = this.configService.get<string>('ALLINGAME_API_TOKEN') || 'default-mock-token';
    this.cacheTtl = this.configService.get<number>('ALLINGAME_CACHE_TTL') || 60000;
    this.authKey = this.configService.get<string>('ALLINGAME_API_KEY') || 'default-auth-key';
  }


  private getRequestHeaders(sig: string) {
    return {
      Authorization: `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json',
      "allingame-key": `${this.authKey}`,
      "X-REQUEST-SIGN": `${sig}`
    };
  }

  async getGames(): Promise<Game[]> {
    const cacheKey = 'all-in-game:games';

    // Check cache
    const cached = await this.cacheManager.get<Game[]>(cacheKey);
    if (cached) {
      this.logger.log('Returning games list from cache');
      return cached;
    }

    this.logger.log(`Fetching games list from API: ${this.apiUrl}/games`);
    try {
      const response = await this.httpService.axiosRef.get<Game[]>(
        `${this.apiUrl}/games`,
        { headers: this.getRequestHeaders(''), timeout: 5000 },
      );

      const games = response.data;
      await this.cacheManager.set(cacheKey, games, this.cacheTtl);
      return games;
    } catch (err) {
      this.logger.warn(
        `Failed to fetch games from API (${err.message}). Falling back to cached mocks.`,
      );

      // Store mock games in cache to avoid spamming the endpoint
      await this.cacheManager.set(cacheKey, this.mockGames, this.cacheTtl);
      return this.mockGames;
    }
  }

  async startSession(
    body: StartSessionDto,
  ) {
    this.logger.log(
      `Starting game session for user ${body.user.nickname} on game ${body.game_id}`,
    );

    try {
      const signature = this.signatureService.generateSignature(JSON.stringify(body));
      const response = await this.httpService.axiosRef.post<{
        url: string,
      }>(
        `${this.apiUrl}/session/`,
        { ...body },
        { headers: this.getRequestHeaders(signature) },
      );


      return response.data.url;
    } catch (err) {
      console.log(err.data);
      this.logger.warn(
        `Failed to start game session on API (${err.message}). Returning mock session.`,
      );
    }
  }
}
