import { IsNotEmpty, IsString } from 'class-validator';

export class GetTransactionsQueryDto {
  @IsNotEmpty()
  @IsString()
  userId: string;
}
