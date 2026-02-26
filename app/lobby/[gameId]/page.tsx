"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useGame } from "@/hooks/useGame";
import { useLocalPlayer } from "@/lib/gameStore";
import { apiAction } from "@/lib/api";

export default function LobbyPage() {
    const params = useParams();
    const gameId = params.gameId as string;
    const router = useRouter();
    const { game, players, loading } = useGame(gameId);
    const { playerId } = useLocalPlayer();
    const [mounted, setMounted] = useState(false);
    const [copied, setCopied] = useState(false);
    const [joinToast, setJoinToast] = useState<string | null>(null);
    const prevCountRef = useRef(0);

    useEffect(() => { setMounted(true); }, []);

    const isHost = mounted && game?.hostId === playerId;
    const minPlayers = game?.settings?.minPlayers ?? 2;
    const canStart = players.length >= minPlayers;

    // Detect new player joins and show toast
    useEffect(() => {
        if (players.length > prevCountRef.current && prevCountRef.current > 0) {
            const newPlayer = players[players.length - 1];
            if (newPlayer && newPlayer.id !== playerId) {
                setJoinToast(`${newPlayer.name} joined!`);
                setTimeout(() => setJoinToast(null), 3000);
            }
        }
        prevCountRef.current = players.length;
    }, [players, playerId]);

    useEffect(() => {
        if (game?.phase === "reveal") router.push(`/game/${gameId}/reveal`);
    }, [game?.phase, gameId, router]);

    async function startGame() {
        if (!canStart) return;
        await apiAction(gameId, "start");
    }

    function copyShareLink() {
        const joinUrl = `${window.location.origin}/join?code=${game?.roomCode}`;
        navigator.clipboard.writeText(joinUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        });
    }

    if (loading) return <LoadingScreen />;

    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
            <motion.div className="w-full max-w-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

                {/* Room Code */}
                <div className="glass-card p-6 mb-4 text-center glow-border-cyan">
                    <p className="text-xs text-cyan-400 font-orbitron tracking-widest mb-2">ROOM CODE</p>
                    <div className="room-code">{game?.roomCode}</div>
                    <p className="text-white/40 text-xs mt-2">Share this with friends to join on their phones</p>

                    {/* Share link button */}
                    <motion.button
                        onClick={copyShareLink}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all border"
                        style={{
                            background: copied ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.05)",
                            borderColor: copied ? "rgba(52,211,153,0.4)" : "rgba(255,255,255,0.1)",
                            color: copied ? "#6ee7b7" : "rgba(255,255,255,0.5)",
                        }}
                        whileTap={{ scale: 0.95 }}>
                        {copied ? "✅ Link Copied!" : "🔗 Copy Invite Link"}
                    </motion.button>
                </div>

                {/* Settings badges */}
                <div className="glass-card p-4 mb-4 flex flex-wrap gap-2 justify-center">
                    <span className="badge badge-purple">{game?.settings.category === "mix" ? "🎲 Mix" : game?.settings.category}</span>
                    <span className={`badge ${game?.settings.difficulty === "easy" ? "badge-green" : game?.settings.difficulty === "medium" ? "badge-purple" : "badge-red"}`}>
                        {game?.settings.difficulty}
                    </span>
                    <span className="badge badge-pink">👥 {game?.settings.numImposters} imposter{(game?.settings.numImposters ?? 1) > 1 ? "s" : ""}</span>
                    <span className="badge badge-cyan">🔄 {game?.settings.totalRounds} rounds</span>
                    {game?.settings.timerMode && <span className="badge badge-purple">⏱ {game.settings.timerDuration}s</span>}
                </div>

                {/* Players list */}
                <div className="glass-card p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-orbitron text-sm font-bold text-purple-300 tracking-wider">PLAYERS</h2>
                        <span className="badge badge-purple">{players.length}</span>
                    </div>

                    <div className="space-y-2">
                        <AnimatePresence>
                            {players.map((p, i) => (
                                <motion.div key={p.id}
                                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }} transition={{ delay: i * 0.05 }}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                                        style={{ background: `hsl(${(i * 60) % 360}, 70%, 40%)` }}>
                                        {p.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-white font-medium flex-1">{p.name}</span>
                                    {p.isHost && <span className="badge badge-cyan text-xs">Host</span>}
                                    {p.id === playerId && <span className="badge badge-purple text-xs">You</span>}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {!canStart && (
                        <p className="text-white/30 text-xs text-center mt-4">
                            Need at least {minPlayers} players to start ({players.length}/{minPlayers})
                        </p>
                    )}
                </div>

                {isHost ? (
                    <button className="btn-primary w-full text-lg" onClick={startGame} disabled={!canStart}>
                        {!canStart ? `Waiting for players... (${players.length}/${minPlayers})` : "🚀 Start Game!"}
                    </button>
                ) : (
                    <div className="glass-card p-5 text-center">
                        <motion.div className="text-3xl mb-2" animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}>⏳</motion.div>
                        <p className="text-white/50 text-sm">Waiting for host to start...</p>
                    </div>
                )}
            </motion.div>

            {/* Join toast notification */}
            <AnimatePresence>
                {joinToast && (
                    <motion.div
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl text-sm font-semibold text-white shadow-2xl z-50 flex items-center gap-2"
                        style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.9), rgba(6,182,212,0.7))", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.15)" }}
                        initial={{ opacity: 0, y: 30, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}>
                        <span>👋</span> {joinToast}
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}

function LoadingScreen() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <motion.div className="text-4xl" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>🔄</motion.div>
        </div>
    );
}

