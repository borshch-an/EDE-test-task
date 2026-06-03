export type Gender = 'm' | 'f';

export type ClientType = 'mobile' | 'desktop';

export interface Urls {
    deposit_url: string;
    return_url: string;
}

export interface User {
    user_id?: string;

    nickname: string;
    firstname: string;
    lastname: string;

    country: string;
    city: string;

    date_of_birth: string;
    registred_at: string;

    gender: Gender;
}

export interface StartSessionPayload {
    game_id: number;
    currency: string;
    locale: string;
    ip: string;
    client_type: ClientType;
    url: Urls;
    user: User;
}

export type GameCategory =
    | 'slots'
    | 'scratch'
    | 'roulette'
    | 'card'
    | 'casual'
    | 'lottery'
    | 'poker'
    | 'craps'
    | 'crash'
    | 'fishing'
    | 'mines'
    | 'video_poker'
    | 'virtual_sports';

export type DeviceType = 'mobile' | 'desktop';

export interface GameRestrictions {
    blacklist?: string[];
    whitelist?: string[];
}

export interface Game {
    id: number;

    title: string;

    producer: string;

    category: GameCategory;

    theme?: string;

    has_freespins?: boolean;

    feature_group: string;

    devices: DeviceType[];

    licenses: string[];

    jackpot_type: string;

    forbid_bonus_play: boolean;

    lines?: number;

    payout?: number;

    volatility_rating?: string;

    has_jackpot?: boolean;

    hd?: boolean;

    restrictions?: GameRestrictions;

    has_live?: boolean;
}