import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class WinCallbackDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  gameId: string;

  @IsNotEmpty()
  @IsString()
  roundId: string;

  @IsNotEmpty()
  @IsString()
  transactionId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  winAmount: number;
}
