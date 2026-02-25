/**
 * Typed API client — all game actions go through here.
 * Replaces Firebase SDK calls.
 */

import { GameState, Player } from "./gameLogic";

export interface GamePayload {
    game: GameState & { lastVotedOut?: string; lastWasSkip?: boolean };
    players: Player[];
}

const base = "/api/game";

export async function apiCreateGame(hostName: string, settings: object): Promise<{ gameId: string; roomCode: string; hostId: string }> {
    const r = await fetch(base, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostName, settings }),
    });
    return r.json();
}

export async function apiFindByCode(code: string): Promise<{ gameId: string; phase: string } | null> {
    const r = await fetch(`${base}?code=${encodeURIComponent(code)}`);
    if (!r.ok) return null;
    return r.json();
}

export async function apiGetGame(gameId: string): Promise<GamePayload | null> {
    const r = await fetch(`${base}/${gameId}`);
    if (!r.ok) return null;
    return r.json();
}

export async function apiAction(gameId: string, action: string, extra: object = {}): Promise<void> {
    await fetch(`${base}/${gameId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
    });
}
