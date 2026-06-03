import { IsNotEmpty, IsString } from 'class-validator';

export class BalanceCallbackDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  gameId: string;
}
