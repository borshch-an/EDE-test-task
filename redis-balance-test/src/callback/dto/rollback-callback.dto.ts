import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNotEmpty, IsString, ValidateNested } from 'class-validator';

export enum ActionType {
  ROLLBACK = 'rollback'
}

export class ActionDto {
  @IsEnum(ActionType)
  action: ActionType;

  @IsString()
  @IsNotEmpty()
  action_id: string;

  @IsString()
  @IsNotEmpty()
  original_action_id: string;
}

export class RollbackCallbackDto {
  @IsNotEmpty()
  @IsString()
  user_id: string;

  @IsNotEmpty()
  @IsString()
  game_id: string;

  @IsNotEmpty()
  @IsString()
  currency: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActionDto)
  actions: ActionDto[];

}
