import { Game, StartSessionPayload } from "./types";

export const API_BASE = "http://localhost:5000";

export interface ProfileData {
    username: string;
    balance: number;
    currency: string;
}

export interface GameItem {
    id: string;
    name: string;
    provider: string;
    thumbnail: string;
    category: string;
}

export async function fetchProfile(userId?: string): Promise<ProfileData> {
    const response = await fetch(`${API_BASE}/me?userId=${userId ?? "user-1"}`, {
        method: "GET",
        cache: "no-store"
    });

    if (!response.ok) {
        throw new Error("Failed to load profile data");
    }

    return response.json();
}

export async function fetchGames(): Promise<Game[]> {
    const response = await fetch(`${API_BASE}/games`, {
        method: "GET",
        cache: "no-store"
    });

    if (!response.ok) {
        throw new Error("Failed to load games list");
    }

    return response.json();
}

export async function startGame(body: StartSessionPayload): Promise<string> {
    const response = await fetch(`${API_BASE}/games/start`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body),
        cache: "no-store"
    });

    if (!response.ok) {
        throw new Error("Failed to start game");
    }

    return await response.text();
}
