import { Controller, Get, Post, Body, NotFoundException, BadRequestException } from '@nestjs/common';
import { AllInGameService } from '../all-in-game/all-in-game.service';
import { BalanceService } from '../balance/balance.service';
import { TransactionsService } from '../transactions/transactions.service';
import { UsersService } from '../users/users.service';
import { StartSessionDto } from './dto/start-game.dto';
import { Game } from '../all-in-game/game.interface';

@Controller('games')
export class GamesController {
  constructor(
    private readonly allInGameService: AllInGameService,
    private readonly balanceService: BalanceService,
    private readonly transactionsService: TransactionsService,
    private readonly usersService: UsersService,
  ) { }

  @Get()
  async getGames(): Promise<Game[]> {
    return this.allInGameService.getGames();
  }

  @Post('start')
  async startGame(
    @Body() startGameDto: StartSessionDto,
  ): Promise<string | undefined> {
    const { user } = startGameDto;

    const userExists = await this.usersService.exists(user.user_id);
    if (!userExists) {
      throw new NotFoundException(`User with ID ${user.user_id} not found`);
    }

    const sessionRes = await this.allInGameService.startSession(startGameDto);

    if (!sessionRes) {
      throw new BadRequestException('Failed to initialize game session with partner API');
    }

    return sessionRes;
  }
}
