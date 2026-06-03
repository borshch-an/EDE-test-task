import { Controller, Get, Query, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { BalanceService } from '../balance/balance.service';
import { GetMeQueryDto } from './dto/get-me-query.dto';

@Controller('me')
export class MeController {
  constructor(
    private readonly usersService: UsersService,
    private readonly balanceService: BalanceService,
  ) { }

  @Get()
  async getProfile(
    @Query() query: GetMeQueryDto,
  ): Promise<{ id: string; username: string; email: string; balance: number, currency: string }> {
    const user = await this.usersService.findOne(query.userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${query.userId} not found`);
    }

    const balance = await this.balanceService.getBalance(query.userId);

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      balance,
      currency: user.currency,
    };
  }
}
