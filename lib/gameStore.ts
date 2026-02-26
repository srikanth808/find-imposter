import { create } from "zustand";
import { persist } from "zustand/middleware";
import { GameState, Player } from "./gameLogic";

interface LocalPlayerState {
    playerId: string | null;
    playerName: string | null;
    gameId: string | null;
    setPlayer: (id: string, name: string) => void;
    setGameId: (id: string) => void;
    clear: () => void;
}

export const useLocalPlayer = create<LocalPlayerState>()(
    persist(
        (set) => ({
            playerId: null,
            playerName: null,
            gameId: null,
            setPlayer: (id, name) => set({ playerId: id, playerName: name }),
            setGameId: (id) => set({ gameId: id }),
            clear: () => set({ playerId: null, playerName: null, gameId: null }),
        }),
        {
            name: "find-imposter-storage",
        }
    )
);
