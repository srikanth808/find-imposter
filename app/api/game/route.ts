import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase";
import { generateRoomCode, GameSettings } from "@/lib/gameLogic";

// POST /api/game — create a new game
export async function POST(req: NextRequest) {
    const { hostName, settings } = await req.json() as { hostName: string; settings: GameSettings };
    const db = getServerClient();

    const gameId = Math.random().toString(36).slice(2, 10);
    const roomCode = generateRoomCode();
    const hostId = `host_${Date.now()}`;

    // Create game row
    const { error: gameErr } = await db.from("games").insert({
        id: gameId,
        room_code: roomCode,
        host_id: hostId,
        phase: "lobby",
        settings,
        current_round: 1,
        word: "",
        category: "",
        imposters: [],
        imposter_hint: "",
        votes: {},
        round_history: [],
        timer_start: null,
        last_voted_out: "",
        last_was_skip: false,
        created_at: Date.now(),
    });
    if (gameErr) return NextResponse.json({ error: gameErr.message }, { status: 500 });

    // Create host player row
    const { error: playerErr } = await db.from("players").insert({
        id: hostId,
        game_id: gameId,
        name: hostName,
        score: 0,
        is_ready: false,
        has_voted: false,
        is_host: true,
        voted_for: null,
        is_eliminated: false,
    });
    if (playerErr) return NextResponse.json({ error: playerErr.message }, { status: 500 });

    return NextResponse.json({ gameId, roomCode, hostId });
}

// GET /api/game?code=XXXXXX — look up game by room code
export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get("code")?.toUpperCase();
    if (!code) return NextResponse.json({ error: "missing code" }, { status: 400 });

    const db = getServerClient();
    const { data, error } = await db
        .from("games")
        .select("id, phase")
        .eq("room_code", code)
        .single();

    if (error || !data) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ gameId: data.id, phase: data.phase });
}
