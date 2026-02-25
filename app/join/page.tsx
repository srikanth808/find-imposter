"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocalPlayer } from "@/lib/gameStore";
import { apiFindByCode, apiAction } from "@/lib/api";
import Link from "next/link";

export default function JoinPage() {
    const router = useRouter();
    const { setPlayer, setGameId } = useLocalPlayer();
    const [roomCode, setRoomCode] = useState("");
    const [playerName, setPlayerName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleJoin() {
        if (!roomCode.trim()) { setError("Enter a room code!"); return; }
        if (!playerName.trim()) { setError("Enter your name!"); return; }
        setLoading(true);
        setError("");
        try {
            const result = await apiFindByCode(roomCode.trim());
            if (!result) { setError("Room not found. Check the code!"); setLoading(false); return; }
            if (result.phase !== "lobby") { setError("Game already started!"); setLoading(false); return; }

            const playerId = `player_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

            await apiAction(result.gameId, "join", { playerId, playerName: playerName.trim() });

            setPlayer(playerId, playerName.trim());
            setGameId(result.gameId);
            router.push(`/lobby/${result.gameId}`);
        } catch {
            setError("Something went wrong. Try again.");
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen flex items-center justify-center px-4">
            <motion.div className="w-full max-w-md" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
                <Link href="/" className="text-purple-400 text-sm mb-6 inline-flex items-center gap-2 hover:text-purple-300">← Back</Link>
                <div className="glass-card p-8 glow-border">
                    <div className="text-5xl mb-4 text-center">🔑</div>
                    <h1 className="font-orbitron text-2xl font-bold glow-text text-center mb-2">Join Game</h1>
                    <p className="text-white/50 text-sm text-center mb-8">Enter the room code from your host</p>

                    <div className="mb-5">
                        <label className="block text-sm text-purple-300 mb-2 font-semibold">Room Code</label>
                        <input className="game-input text-center text-3xl tracking-[0.3em] font-orbitron font-bold uppercase"
                            placeholder="ABC123"
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                            maxLength={6} />
                    </div>

                    <div className="mb-8">
                        <label className="block text-sm text-purple-300 mb-2 font-semibold">Your Name</label>
                        <input className="game-input" placeholder="Enter your name..."
                            value={playerName} onChange={(e) => setPlayerName(e.target.value)} maxLength={20} />
                    </div>

                    {error && (
                        <motion.p className="text-red-400 text-sm mb-4 text-center"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            ⚠️ {error}
                        </motion.p>
                    )}

                    <button className="btn-primary w-full text-lg" onClick={handleJoin} disabled={loading}>
                        {loading ? "Joining..." : "🚀 Join Room"}
                    </button>
                </div>
            </motion.div>
        </main>
    );
}
