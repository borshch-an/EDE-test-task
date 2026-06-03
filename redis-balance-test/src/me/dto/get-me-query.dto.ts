import { IsNotEmpty, IsString } from 'class-validator';

export class GetMeQueryDto {
  @IsNotEmpty()
  @IsString()
  userId: string;
}
