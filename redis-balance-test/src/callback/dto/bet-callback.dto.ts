import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class BetCallbackDto {
  @IsNotEmpty()
  @IsString()
  user_id: string;

  @IsNotEmpty()
  @IsString()
  gameId: string;

  @IsNotEmpty()
  @IsString()
  transactionId: string;

}
