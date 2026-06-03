import {
    IsArray,
    IsNotEmpty,
    IsNumber,
    IsString,
    ValidateNested,
    IsEnum
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ActionType {
    BET = 'bet',
    WIN = 'win',
}

export class ActionDto {
    @IsEnum(ActionType)
    action: ActionType;

    @IsNumber()
    amount: number;

    @IsString()
    @IsNotEmpty()
    action_id: string;
}

export class PlayCallbackDto {
    @IsString()
    @IsNotEmpty()
    user_id: string;

    @IsString()
    @IsNotEmpty()
    game: string;

    @IsString()
    @IsNotEmpty()
    currency: string;

    @IsString()
    @IsNotEmpty()
    gameId: string;

    @IsString()
    @IsNotEmpty()
    game_id?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ActionDto)
    actions: ActionDto[];
}