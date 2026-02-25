import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase";
import {
    tallyVotes,
    calculateScores,
    buildNewRound,
    Player,
    RoundHistory,
} from "@/lib/gameLogic";

type Params = { params: Promise<{ gameId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
    const { gameId } = await params;
    const db = getServerClient();

    const [{ data: game }, { data: players }] = await Promise.all([
        db.from("games").select("*").eq("id", gameId).single(),
        db.from("players").select("*").eq("game_id", gameId),
    ]);

    if (!game) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ game: dbToGame(game), players: (players ?? []).map(dbToPlayer) });
}

export async function POST(req: NextRequest, { params }: Params) {
    const { gameId } = await params;
    const body = await req.json() as { action: string } & Record<string, unknown>;
    const db = getServerClient();

    const { data: game } = await db.from("games").select("*").eq("id", gameId).single();
    if (!game) return NextResponse.json({ error: "not found" }, { status: 404 });

    const { data: playerRows } = await db.from("players").select("*").eq("game_id", gameId);
    const players: Player[] = (playerRows ?? []).map(dbToPlayer);

    switch (body.action) {

        case "join": {
            const { playerId, playerName } = body as unknown as { playerId: string; playerName: string };
            await db.from("players").insert({
                id: playerId, game_id: gameId, name: playerName,
                score: 0, is_ready: false, has_voted: false, is_host: false, voted_for: null, is_eliminated: false,
            });
            return NextResponse.json({ ok: true });
        }

        case "start": {
            const playerIds = players.map((p) => p.id);
            const { word, category, imposters, imposterHint } = buildNewRound(game.settings, playerIds);
            await db.from("games").update({
                phase: "reveal", word, category, imposters, imposter_hint: imposterHint,
                current_round: 1, votes: {},
            }).eq("id", gameId);
            await db.from("players").update({ is_ready: false, has_voted: false, voted_for: null }).eq("game_id", gameId);
            return NextResponse.json({ ok: true });
        }

        case "ready": {
            const { playerId } = body as unknown as { playerId: string };
            await db.from("players").update({ is_ready: true }).eq("id", playerId).eq("game_id", gameId);
            // Check if all ready
            const { data: updated } = await db.from("players").select("is_ready").eq("game_id", gameId);
            const allReady = (updated ?? []).every((p: { is_ready: boolean }) => p.is_ready);
            if (allReady) {
                await db.from("games").update({ phase: "discuss", timer_start: Date.now() }).eq("id", gameId);
            }
            return NextResponse.json({ ok: true });
        }

        case "startVoting": {
            await db.from("players").update({ has_voted: false, voted_for: null }).eq("game_id", gameId);
            await db.from("games").update({ phase: "vote", votes: {} }).eq("id", gameId);
            return NextResponse.json({ ok: true });
        }

        case "vote": {
            const { playerId, targetId } = body as unknown as { playerId: string; targetId: string };
            await db.from("players").update({ has_voted: true, voted_for: targetId }).eq("id", playerId).eq("game_id", gameId);
            const newVotes = { ...(game.votes ?? {}), [playerId]: targetId };
            await db.from("games").update({ votes: newVotes }).eq("id", gameId);

            // Check if all voted
            const { data: updatedPlayers } = await db.from("players").select("*").eq("game_id", gameId);
            const allVoted = (updatedPlayers ?? []).every((p: { has_voted: boolean }) => p.has_voted);
            if (allVoted) {
                const allP: Player[] = (updatedPlayers ?? []).map(dbToPlayer);
                const { votedOut, wasSkip } = tallyVotes(newVotes, allP);
                const deltas = calculateScores(allP, game.imposters, votedOut, wasSkip);
                // Update scores
                for (const p of allP) {
                    const delta = deltas[p.id] || 0;
                    if (delta) await db.from("players").update({ score: p.score + delta }).eq("id", p.id).eq("game_id", gameId);
                }
                const history: RoundHistory = {
                    round: game.current_round, word: game.word, category: game.category,
                    imposters: game.imposters, votedOut, wasCorrect: game.imposters.includes(votedOut),
                };
                await db.from("games").update({
                    phase: "result",
                    round_history: [...(game.round_history ?? []), history],
                    last_voted_out: votedOut,
                    last_was_skip: wasSkip,
                }).eq("id", gameId);
            }
            return NextResponse.json({ ok: true });
        }

        case "nextRound": {
            const isLast = game.current_round >= game.settings.totalRounds;
            if (isLast) {
                await db.from("games").update({ phase: "scores" }).eq("id", gameId);
            } else {
                const playerIds = players.map((p) => p.id);
                const { word, category, imposters, imposterHint } = buildNewRound(game.settings, playerIds);
                await db.from("games").update({
                    phase: "reveal", word, category, imposters, imposter_hint: imposterHint,
                    current_round: game.current_round + 1, votes: {},
                }).eq("id", gameId);
                await db.from("players").update({ is_ready: false, has_voted: false, voted_for: null }).eq("game_id", gameId);
            }
            return NextResponse.json({ ok: true });
        }

        case "playAgain": {
            await db.from("players").update({ score: 0, is_ready: false, has_voted: false, voted_for: null }).eq("game_id", gameId);
            await db.from("games").update({
                phase: "lobby", current_round: 1, word: "", category: "",
                imposters: [], votes: {}, round_history: [], timer_start: null,
            }).eq("id", gameId);
            return NextResponse.json({ ok: true });
        }

        case "endGame": {
            await db.from("games").update({ phase: "ended" }).eq("id", gameId);
            return NextResponse.json({ ok: true });
        }

        default:
            return NextResponse.json({ error: "unknown action" }, { status: 400 });
    }
}

// DB row → app types
function dbToGame(row: Record<string, unknown>) {
    return {
        id: row.id,
        roomCode: row.room_code,
        hostId: row.host_id,
        phase: row.phase,
        settings: row.settings,
        currentRound: row.current_round,
        word: row.word,
        category: row.category,
        imposters: row.imposters,
        imposterHint: row.imposter_hint,
        votes: row.votes,
        roundHistory: row.round_history,
        timerStart: row.timer_start,
        lastVotedOut: row.last_voted_out,
        lastWasSkip: row.last_was_skip,
    };
}

function dbToPlayer(row: Record<string, unknown>): Player {
    return {
        id: row.id as string,
        name: row.name as string,
        score: row.score as number,
        isReady: row.is_ready as boolean,
        hasVoted: row.has_voted as boolean,
        isHost: row.is_host as boolean,
        votedFor: row.voted_for as string | null,
        isEliminated: row.is_eliminated as boolean,
    };
}
