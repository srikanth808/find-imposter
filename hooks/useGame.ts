"use client";
import { useEffect, useState, useRef } from "react";
import { GameState, Player } from "@/lib/gameLogic";
import { GamePayload } from "@/lib/api";

export function useGame(gameId: string | null) {
    const [game, setGame] = useState<(GameState & { lastVotedOut?: string; lastWasSkip?: boolean }) | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const esRef = useRef<EventSource | null>(null);

    useEffect(() => {
        if (!gameId) return;

        // Close any previous connection
        esRef.current?.close();

        const es = new EventSource(`/api/game/${gameId}/stream`);
        esRef.current = es;

        es.onmessage = (e) => {
            try {
                const payload = JSON.parse(e.data) as GamePayload;
                setGame(payload.game as any);
                setPlayers(payload.players);
                setLoading(false);
            } catch { /* ignore parse errors */ }
        };

        es.onerror = () => {
            // Retry handled automatically by EventSource
            setLoading(false);
        };

        return () => {
            es.close();
        };
    }, [gameId]);

    return { game, players, loading };
}
