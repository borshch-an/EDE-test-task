import { IsNotEmpty, IsNumber, IsString, Min, IsObject, ValidateNested, IsDefined, IsOptional, IsISO8601 } from 'class-validator';
import { Type } from 'class-transformer';

export class UrlsDto {
  @IsNotEmpty()
  @IsString()
  deposit_url: string;

  @IsNotEmpty()
  @IsString()
  return_url: string;
}

export class UserDto {
  @IsNotEmpty()
  @IsString()
  user_id: string;

  @IsNotEmpty()
  @IsString()
  nickname: string;

  @IsNotEmpty()
  @IsString()
  firstname: string;

  @IsNotEmpty()
  @IsString()
  lastname: string;

  @IsNotEmpty()
  @IsString()
  country: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsNotEmpty()
  @IsISO8601()
  date_of_birth: string;

  @IsNotEmpty()
  @IsISO8601()
  registred_at: string;

  @IsNotEmpty()
  @IsString()
  gender: string; // m or f
}

export class StartSessionDto {
  @IsNotEmpty()
  @IsNumber()
  game_id: number;

  @IsNotEmpty()
  @IsString()
  currency: string;

  @IsNotEmpty()
  @IsString()
  locale: string;

  @IsNotEmpty()
  @IsString()
  ip: string;

  @IsNotEmpty()
  @IsString()
  client_type: string;

  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => UrlsDto)
  url: UrlsDto;

  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => UserDto)
  user: UserDto;

}
