import { NextRequest, NextResponse } from "next/server";
import { gameStore, GameRecord } from "@/lib/store";
import { broadcastGame } from "@/lib/sse";
import {
    tallyVotes,
    calculateScores,
    buildNewRound,
    RoundHistory,
    Player,
} from "@/lib/gameLogic";

type Params = { params: Promise<{ gameId: string }> };

function broadcast(gameId: string, g: GameRecord) {
    const { players, ...game } = g;
    broadcastGame(gameId, { game, players: Object.values(players) });
}

export async function GET(_req: NextRequest, { params }: Params) {
    const { gameId } = await params;
    const g = gameStore.get(gameId);
    if (!g) return NextResponse.json({ error: "not found" }, { status: 404 });
    const { players, ...game } = g;
    return NextResponse.json({ game, players: Object.values(players) });
}

export async function POST(req: NextRequest, { params }: Params) {
    const { gameId } = await params;
    const body = await req.json() as { action: string;[k: string]: unknown };
    const g = gameStore.get(gameId);
    if (!g) return NextResponse.json({ error: "not found" }, { status: 404 });

    switch (body.action) {
        // ── join ──────────────────────────────────────────
        case "join": {
            const { playerId, playerName } = body as unknown as { playerId: string; playerName: string };
            g.players[playerId] = {
                id: playerId,
                name: playerName,
                score: 0,
                isReady: false,
                hasVoted: false,
                isHost: false,
                votedFor: null,
                isEliminated: false,
            };
            broadcast(gameId, g);
            return NextResponse.json({ ok: true });
        }

        // ── start ─────────────────────────────────────────
        case "start": {
            const playerIds = Object.keys(g.players);
            const { word, category, imposters, imposterHint } = buildNewRound(g.settings, playerIds);
            Object.values(g.players).forEach((p) => {
                p.isReady = false; p.hasVoted = false; p.votedFor = null;
            });
            Object.assign(g, { phase: "reveal", word, category, imposters, imposterHint, currentRound: 1, votes: {} });
            broadcast(gameId, g);
            return NextResponse.json({ ok: true });
        }

        // ── ready ─────────────────────────────────────────
        case "ready": {
            const { playerId } = body as unknown as { playerId: string };
            if (g.players[playerId]) g.players[playerId].isReady = true;
            const allReady = Object.values(g.players).every((p) => p.isReady);
            if (allReady) Object.assign(g, { phase: "discuss", timerStart: Date.now() });
            broadcast(gameId, g);
            return NextResponse.json({ ok: true });
        }

        // ── startVoting ───────────────────────────────────
        case "startVoting": {
            Object.values(g.players).forEach((p) => { p.hasVoted = false; p.votedFor = null; });
            Object.assign(g, { phase: "vote", votes: {} });
            broadcast(gameId, g);
            return NextResponse.json({ ok: true });
        }

        // ── vote ──────────────────────────────────────────
        case "vote": {
            const { playerId, targetId } = body as unknown as { playerId: string; targetId: string };
            if (g.players[playerId]) { g.players[playerId].hasVoted = true; g.players[playerId].votedFor = targetId; }
            g.votes[playerId] = targetId;
            const allVoted = Object.values(g.players).every((p) => p.hasVoted);
            if (allVoted) {
                const players = Object.values(g.players);
                const { votedOut, wasSkip } = tallyVotes(g.votes, players);
                const deltas = calculateScores(players, g.imposters, votedOut, wasSkip);
                Object.values(g.players).forEach((p) => { p.score += deltas[p.id] || 0; });
                const history: RoundHistory = {
                    round: g.currentRound,
                    word: g.word,
                    category: g.category,
                    imposters: g.imposters,
                    votedOut,
                    wasCorrect: g.imposters.includes(votedOut),
                };
                Object.assign(g, {
                    phase: "result",
                    roundHistory: [...g.roundHistory, history],
                    lastVotedOut: votedOut,
                    lastWasSkip: wasSkip,
                });
            }
            broadcast(gameId, g);
            return NextResponse.json({ ok: true });
        }

        // ── nextRound ─────────────────────────────────────
        case "nextRound": {
            const isLast = g.currentRound >= g.settings.totalRounds;
            if (isLast) {
                g.phase = "scores";
            } else {
                const playerIds = Object.keys(g.players);
                const { word, category, imposters, imposterHint } = buildNewRound(g.settings, playerIds);
                Object.values(g.players).forEach((p) => { p.isReady = false; p.hasVoted = false; p.votedFor = null; });
                Object.assign(g, {
                    phase: "reveal", word, category, imposters, imposterHint,
                    currentRound: g.currentRound + 1, votes: {},
                });
            }
            broadcast(gameId, g);
            return NextResponse.json({ ok: true });
        }

        // ── playAgain ─────────────────────────────────────
        case "playAgain": {
            Object.values(g.players).forEach((p) => { p.score = 0; p.isReady = false; p.hasVoted = false; p.votedFor = null; });
            Object.assign(g, { phase: "lobby", currentRound: 1, word: "", category: "", imposters: [], votes: {}, roundHistory: [], timerStart: null });
            broadcast(gameId, g);
            return NextResponse.json({ ok: true });
        }

        // ── endGame ───────────────────────────────────────
        case "endGame": {
            g.phase = "ended";
            broadcast(gameId, g);
            return NextResponse.json({ ok: true });
        }

        default:
            return NextResponse.json({ error: "unknown action" }, { status: 400 });
    }
}
