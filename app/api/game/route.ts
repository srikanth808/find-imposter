import { NextRequest, NextResponse } from "next/server";
import { gameStore } from "@/lib/store";
import { broadcastGame } from "@/lib/sse";
import { generateRoomCode, buildNewRound, GameSettings } from "@/lib/gameLogic";

// POST /api/game — create a new game
export async function POST(req: NextRequest) {
    const { hostName, settings } = await req.json() as { hostName: string; settings: GameSettings };

    const gameId = Math.random().toString(36).slice(2, 10);
    const roomCode = generateRoomCode();
    const hostId = `host_${Date.now()}`;

    const game = {
        id: gameId,
        roomCode,
        hostId,
        phase: "lobby" as const,
        settings,
        currentRound: 1,
        word: "",
        category: "",
        imposters: [] as string[],
        imposterHint: "",
        votes: {} as Record<string, string>,
        roundHistory: [],
        timerStart: null,
        createdAt: Date.now(),
        lastVotedOut: "",
        lastWasSkip: false,
        players: {
            [hostId]: {
                id: hostId,
                name: hostName,
                score: 0,
                isReady: false,
                hasVoted: false,
                isHost: true,
                votedFor: null,
                isEliminated: false,
            },
        },
    };

    gameStore.set(gameId, game);
    return NextResponse.json({ gameId, roomCode, hostId });
}

// GET /api/game?code=XXXXXX — look up game by room code
export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get("code")?.toUpperCase();
    if (!code) return NextResponse.json({ error: "missing code" }, { status: 400 });

    for (const [id, g] of gameStore.entries()) {
        if (g.roomCode === code) {
            return NextResponse.json({ gameId: id, phase: g.phase });
        }
    }
    return NextResponse.json({ error: "not found" }, { status: 404 });
}
