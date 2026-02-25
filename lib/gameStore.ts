import { create } from "zustand";
import { GameState, Player } from "./gameLogic";

interface LocalPlayerState {
    playerId: string | null;
    playerName: string | null;
    gameId: string | null;
    setPlayer: (id: string, name: string) => void;
    setGameId: (id: string) => void;
    clear: () => void;
}

export const useLocalPlayer = create<LocalPlayerState>((set) => ({
    playerId: typeof window !== "undefined" ? localStorage.getItem("playerId") : null,
    playerName: typeof window !== "undefined" ? localStorage.getItem("playerName") : null,
    gameId: typeof window !== "undefined" ? localStorage.getItem("gameId") : null,
    setPlayer: (id, name) => {
        if (typeof window !== "undefined") {
            localStorage.setItem("playerId", id);
            localStorage.setItem("playerName", name);
        }
        set({ playerId: id, playerName: name });
    },
    setGameId: (id) => {
        if (typeof window !== "undefined") {
            localStorage.setItem("gameId", id);
        }
        set({ gameId: id });
    },
    clear: () => {
        if (typeof window !== "undefined") {
            localStorage.removeItem("playerId");
            localStorage.removeItem("playerName");
            localStorage.removeItem("gameId");
        }
        set({ playerId: null, playerName: null, gameId: null });
    },
}));
