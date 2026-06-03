import { Controller, Post, Body, UsePipes, ValidationPipe, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { CallbackService } from './callback.service';
import { BalanceCallbackDto } from './dto/balance-callback.dto';
import { RollbackCallbackDto } from './dto/rollback-callback.dto';
import { ActionType, PlayCallbackDto } from './dto/play-callback.dto';
import { SignatureGuard } from 'src/signature/signature.guard';


@Controller('callback')
export class CallbackController {
  constructor(private readonly callbackService: CallbackService) { }

  @Post('balance')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async getBalance(@Body() dto: BalanceCallbackDto) {
    const { userId } = dto;
    return this.callbackService.getBalance(userId);
  }

  @UseGuards(SignatureGuard)
  @Post('play')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async processPlay(@Body() dto: any) {

    if (!dto.actions) {
      return await this.callbackService.getBalance(dto.user_id);
    }
    const { user_id, game_id, actions } = dto;

    if (dto.actions.length > 1) {
      let betTx, winTx;
      try {
        [betTx, winTx] = await Promise.all([
          this.callbackService.processBet(user_id, game_id, actions[0].action_id, actions[0].amount),
          this.callbackService.processWin(user_id, game_id, actions[1].action_id, actions[1].amount)
        ]);
      } catch (error) {
        if (betTx) {
          await this.callbackService.processRollback(user_id, game_id, betTx.id, actions[0].action_id);
        }
        if (winTx) {
          await this.callbackService.processRollback(user_id, game_id, winTx.id, actions[1].action_id);
        }
        throw error;
      }

      const newBalance = await this.callbackService.getBalance(user_id);
      console.log('Returning combined bet/win response with balance and transactions', {
        balance: newBalance.balance,
        game_id: game_id,
        transactions: [
          betTx,
          winTx
        ]
      });
      return {
        balance: newBalance.balance,
        game_id: game_id,
        transactions: [
          betTx,
          winTx
        ]
      };
    }

    // Single action handling (bet or win)
    if (dto.actions.length === 1) {
      const act = actions[0];
      if (act.action === ActionType.BET) {
        const bet = await this.callbackService.processBet(user_id, game_id, act.action_id, act.amount);
        const newBalance = await this.callbackService.getBalance(user_id);
        return { balance: newBalance.balance, game_id: game_id, transactions: [bet] };
      }
      if (act.action === ActionType.WIN) {
        const win = await this.callbackService.processWin(user_id, game_id, act.action_id, act.amount);
        const newBalance = await this.callbackService.getBalance(user_id);
        return { balance: newBalance.balance, game_id: game_id, transactions: [win] };
      }
    }
  }

  @UseGuards(SignatureGuard)
  @Post('rollback')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async processRollback(@Body() dto: RollbackCallbackDto) {
    const { user_id, game_id, actions } = dto;
    return this.callbackService.processRollback(
      user_id,
      game_id,
      actions[0].action_id,
      actions[0].original_action_id,
    );
  }
}
