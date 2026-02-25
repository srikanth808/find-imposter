"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { GameState, Player } from "@/lib/gameLogic";

type GameRow = {
    id: string; room_code: string; host_id: string; phase: string;
    settings: GameState["settings"]; current_round: number; word: string;
    category: string; imposters: string[]; imposter_hint: string;
    votes: Record<string, string>; round_history: GameState["roundHistory"];
    timer_start: number | null; last_voted_out: string; last_was_skip: boolean;
};

type PlayerRow = {
    id: string; game_id: string; name: string; score: number;
    is_ready: boolean; has_voted: boolean; is_host: boolean;
    voted_for: string | null; is_eliminated: boolean;
};

function rowToGame(row: GameRow): GameState & { lastVotedOut: string; lastWasSkip: boolean } {
    return {
        id: row.id, roomCode: row.room_code, hostId: row.host_id, phase: row.phase as GameState["phase"],
        settings: row.settings, currentRound: row.current_round, word: row.word, category: row.category,
        imposters: row.imposters, imposterHint: row.imposter_hint, votes: row.votes,
        roundHistory: row.round_history, timerStart: row.timer_start,
        createdAt: Date.now(),
        lastVotedOut: row.last_voted_out, lastWasSkip: row.last_was_skip,
    };
}

function rowToPlayer(row: PlayerRow): Player {
    return {
        id: row.id, name: row.name, score: row.score, isReady: row.is_ready,
        hasVoted: row.has_voted, isHost: row.is_host, votedFor: row.voted_for,
        isEliminated: row.is_eliminated,
    };
}

export function useGame(gameId: string | null) {
    const [game, setGame] = useState<(GameState & { lastVotedOut?: string; lastWasSkip?: boolean }) | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!gameId) return;

        // Initial fetch
        async function fetchAll() {
            const [{ data: g }, { data: p }] = await Promise.all([
                supabase.from("games").select("*").eq("id", gameId).single(),
                supabase.from("players").select("*").eq("game_id", gameId),
            ]);
            if (g) setGame(rowToGame(g as GameRow));
            if (p) setPlayers((p as PlayerRow[]).map(rowToPlayer));
            setLoading(false);
        }
        fetchAll();

        // Real-time subscription — Supabase pushes any DB change instantly
        const channel = supabase
            .channel(`game_${gameId}`)
            .on("postgres_changes", { event: "*", schema: "public", table: "games", filter: `id=eq.${gameId}` },
                (payload) => {
                    if (payload.new) setGame(rowToGame(payload.new as GameRow));
                })
            .on("postgres_changes", { event: "*", schema: "public", table: "players", filter: `game_id=eq.${gameId}` },
                async () => {
                    // Re-fetch all players on any player change (handles INSERT + UPDATE)
                    const { data: p } = await supabase.from("players").select("*").eq("game_id", gameId!);
                    if (p) setPlayers((p as PlayerRow[]).map(rowToPlayer));
                })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [gameId]);

    return { game, players, loading };
}
