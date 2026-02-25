/**
 * Server-side in-memory game store.
 * Persists for the lifetime of the Next.js server process.
 * For production, swap this Map with Redis or a DB.
 */

import { GameState, Player } from "@/lib/gameLogic";

type GameRecord = GameState & { players: Record<string, Player> };

declare global {
    // eslint-disable-next-line no-var
    var __gameStore: Map<string, GameRecord> | undefined;
}

// Use a global so hot-reload doesn't reset the store in dev
export const gameStore: Map<string, GameRecord> =
    global.__gameStore ?? (global.__gameStore = new Map());

export type { GameRecord };
