"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useGame } from "@/hooks/useGame";
import { useLocalPlayer } from "@/lib/gameStore";
import { apiAction } from "@/lib/api";

export default function RevealPage() {
    const params = useParams();
    const gameId = params.gameId as string;
    const router = useRouter();
    const { game, players, loading } = useGame(gameId);
    const { playerId } = useLocalPlayer();
    const [revealed, setRevealed] = useState(false);

    const me = players.find((p) => p.id === playerId);
    const isImposter = game?.imposters.includes(playerId ?? "") ?? false;
    const readyCount = players.filter((p) => p.isReady).length;

    useEffect(() => {
        if (game?.phase === "discuss") router.push(`/game/${gameId}/discuss`);
        if (game?.phase === "vote") router.push(`/game/${gameId}/vote`);
    }, [game?.phase, gameId, router]);

    async function markReady() {
        if (!playerId) return;
        await apiAction(gameId, "ready", { playerId });
    }

    if (loading || !game || !me) return <LoadingScreen />;

    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute inset-0 pointer-events-none"
                style={{ background: isImposter ? "radial-gradient(ellipse at center, rgba(127,0,0,0.15) 0%, transparent 70%)" : "radial-gradient(ellipse at center, rgba(124,58,237,0.12) 0%, transparent 70%)" }} />

            <motion.div className="w-full max-w-sm z-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

                {/* Round badge */}
                <div className="text-center mb-4">
                    <span className="badge badge-purple font-orbitron">ROUND {game.currentRound} / {game.settings.totalRounds}</span>
                </div>

                {/* Player name header */}
                <motion.div className="text-center mb-8"
                    initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                    <p className="text-white/50 text-sm mb-1">Your turn,</p>
                    <h2 className="font-orbitron text-3xl font-black glow-text">{me.name}</h2>
                </motion.div>

                {/* Role card */}
                <AnimatePresence mode="wait">
                    {!revealed ? (
                        <motion.button key="cover"
                            className="w-full glass-card glow-border p-10 text-center cursor-pointer overflow-hidden relative"
                            onClick={() => setRevealed(true)}
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <div className="text-6xl mb-4">👁️</div>
                            <p className="text-white/60 text-sm">Tap to reveal your role</p>
                            <p className="text-white/30 text-xs mt-2">Make sure no one is looking!</p>
                            <motion.div className="absolute inset-0 pointer-events-none"
                                style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)" }}
                                animate={{ x: ["-100%", "200%"] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }} />
                        </motion.button>
                    ) : isImposter ? (
                        <motion.div key="imposter"
                            className="glass-card glow-border-red p-8 text-center"
                            style={{ background: "linear-gradient(135deg, rgba(127,0,0,0.2), rgba(30,0,0,0.1))" }}
                            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", damping: 15 }}>
                            <motion.div className="text-7xl mb-4"
                                animate={{ rotate: [-5, 5, -5] }} transition={{ duration: 2, repeat: Infinity }}>🕵️</motion.div>
                            <div className="badge badge-red mb-4 text-sm px-4 py-2">IMPOSTER</div>
                            <h3 className="font-orbitron text-2xl font-black text-red-300 mb-3">You are the IMPOSTER!</h3>
                            <div className="divider my-4" />
                            <p className="text-white/60 text-sm mb-2">Category: <span className="text-white font-bold">{game.category}</span></p>
                            <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                                <p className="text-red-300 text-xs mb-1">🎭 Blending hint:</p>
                                <p className="text-white/70 text-sm italic">&quot;{game.imposterHint}&quot;</p>
                            </div>
                            <p className="text-white/40 text-xs mt-4">Try to blend in. Don&apos;t get caught! 😈</p>
                        </motion.div>
                    ) : (
                        <motion.div key="word"
                            className="glass-card glow-border p-8 text-center"
                            style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,182,212,0.05))" }}
                            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", damping: 15 }}>
                            <div className="badge badge-cyan mb-4 text-sm px-4 py-2">{game.category}</div>
                            <p className="text-white/50 text-sm mb-3">The secret word is:</p>
                            <motion.h3
                                className="font-orbitron text-4xl font-black mb-4"
                                style={{ background: "linear-gradient(135deg, #c4b5fd, #67e8f9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                                animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                                {game.word}
                            </motion.h3>
                            <div className="divider my-4" />
                            <p className="text-white/40 text-xs">Remember this! There&apos;s an imposter among you 🔍</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Done / Ready button */}
                {revealed && !me.isReady && (
                    <motion.button className="btn-primary w-full mt-6 text-lg" onClick={markReady}
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        ✅ I&apos;ve Seen My Word
                    </motion.button>
                )}
                {me.isReady && (
                    <motion.div className="mt-6 glass-card p-4 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <p className="text-green-400 text-sm font-semibold">✓ Ready! Waiting for others...</p>
                    </motion.div>
                )}

                {/* Ready tracker */}
                <motion.div className="mt-4 glass-card p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                    <div className="flex items-center justify-between text-xs text-white/40 mb-2">
                        <span>Players ready</span>
                        <span className="font-orbitron text-purple-300">{readyCount} / {players.length}</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                        <motion.div className="h-2 rounded-full"
                            style={{ background: "linear-gradient(90deg, #7c3aed, #06b6d4)" }}
                            animate={{ width: `${players.length > 0 ? (readyCount / players.length) * 100 : 0}%` }}
                            transition={{ duration: 0.5 }} />
                    </div>
                    <div className="flex flex-wrap gap-1 mt-3">
                        {players.map((p) => (
                            <span key={p.id} className={`text-xs px-2 py-1 rounded-lg ${p.isReady ? "bg-green-500/20 text-green-300" : "bg-white/5 text-white/30"}`}>
                                {p.name.split(" ")[0]}
                            </span>
                        ))}
                    </div>
                </motion.div>
            </motion.div>
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
