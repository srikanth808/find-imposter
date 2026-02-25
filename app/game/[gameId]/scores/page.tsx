"use client";
import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useGame } from "@/hooks/useGame";
import { useLocalPlayer } from "@/lib/gameStore";
import { apiAction } from "@/lib/api";
import confetti from "canvas-confetti";

export default function ScoresPage() {
    const params = useParams();
    const gameId = params.gameId as string;
    const router = useRouter();
    const { game, players } = useGame(gameId);
    const { playerId } = useLocalPlayer();
    const isHost = game?.hostId === playerId;
    const confettiFired = useRef(false);

    const sorted = [...players].sort((a, b) => b.score - a.score);
    const winner = sorted[0];

    useEffect(() => {
        if (game?.phase === "reveal") router.push(`/game/${gameId}/reveal`);
        if (game?.phase === "lobby") router.push(`/lobby/${gameId}`);
        if (game?.phase === "ended") router.push("/");
    }, [game?.phase, gameId, router]);

    useEffect(() => {
        if (!confettiFired.current && winner) {
            confettiFired.current = true;
            setTimeout(() => {
                confetti({ particleCount: 200, spread: 100, origin: { y: 0.3 }, colors: ["#7c3aed", "#ec4899", "#06b6d4", "#f59e0b"] });
            }, 500);
        }
    }, [winner]);

    const medalEmojis = ["🥇", "🥈", "🥉"];
    const rankColors = ["#f59e0b", "#9ca3af", "#b45309"];

    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
            <motion.div className="w-full max-w-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

                {/* Header */}
                <div className="text-center mb-8">
                    <motion.div className="text-7xl mb-4 float inline-block" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                        🏆
                    </motion.div>
                    <h1 className="font-orbitron text-3xl font-black glow-text mb-1">Game Over!</h1>
                    <p className="text-white/40 text-sm">{game?.settings.totalRounds} rounds completed</p>
                </div>

                {/* Winner spotlight */}
                {winner && (
                    <motion.div
                        className="glass-card p-6 mb-5 text-center glow-border"
                        style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(124,58,237,0.1))" }}
                        initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", damping: 12 }}>
                        <p className="text-xs text-yellow-400 font-orbitron tracking-widest mb-2">WINNER</p>
                        <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-3"
                            style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
                            {winner.name.charAt(0).toUpperCase()}
                        </div>
                        <h2 className="font-orbitron text-2xl font-black text-yellow-300 mb-1">{winner.name}</h2>
                        <p className="text-yellow-400/70 text-lg font-bold">{winner.score} pts</p>
                    </motion.div>
                )}

                {/* Full leaderboard */}
                <div className="glass-card p-6 mb-6">
                    <p className="text-xs text-purple-300 font-orbitron tracking-wider mb-4">LEADERBOARD</p>
                    <div className="space-y-3">
                        {sorted.map((p, i) => (
                            <motion.div key={p.id}
                                className={`flex items-center gap-3 p-3 rounded-xl ${p.id === playerId ? "bg-purple-500/10 border border-purple-500/20" : "bg-white/5"}`}
                                initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.08 }}>
                                <div className="w-8 text-center">
                                    {i < 3 ? <span className="text-xl">{medalEmojis[i]}</span> : <span className="font-orbitron text-sm text-white/30">{i + 1}</span>}
                                </div>
                                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                                    style={{ background: `hsl(${(i * 67) % 360}, 60%, 40%)` }}>
                                    {p.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-white font-semibold text-sm">{p.name}</span>
                                        {p.id === playerId && <span className="badge badge-purple" style={{ fontSize: "0.65rem", padding: "2px 8px" }}>you</span>}
                                    </div>
                                    <div className="w-full bg-white/10 rounded-full h-1 mt-1.5">
                                        <motion.div className="h-1 rounded-full"
                                            style={{ background: i === 0 ? "linear-gradient(90deg,#f59e0b,#ec4899)" : i === 1 ? "linear-gradient(90deg,#9ca3af,#c4b5fd)" : "linear-gradient(90deg,#7c3aed,#06b6d4)" }}
                                            initial={{ width: 0 }}
                                            animate={{ width: sorted[0]?.score > 0 ? `${(p.score / sorted[0].score) * 100}%` : "0%" }}
                                            transition={{ delay: 0.3 + i * 0.08, duration: 0.8 }} />
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="font-orbitron font-black text-sm" style={{ color: i < 3 ? rankColors[i] : "#c4b5fd" }}>{p.score}</span>
                                    <p className="text-white/30 text-xs">pts</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Round history */}
                {game?.roundHistory && game.roundHistory.length > 0 && (
                    <div className="glass-card p-5 mb-6">
                        <p className="text-xs text-purple-300 font-orbitron tracking-wider mb-3">ROUND HISTORY</p>
                        <div className="space-y-2">
                            {game.roundHistory.map((r, i) => (
                                <div key={i} className="flex items-center gap-3 text-xs">
                                    <span className="text-white/30">R{r.round}</span>
                                    <span className="text-cyan-400 font-bold font-orbitron">{r.word}</span>
                                    <span className="flex-1 text-white/30 truncate">({r.category})</span>
                                    <span>{r.wasCorrect ? "✅" : r.votedOut === "skip" ? "⏭️" : "❌"}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {isHost ? (
                    <div className="flex flex-col gap-3">
                        <button className="btn-primary w-full text-lg" onClick={() => apiAction(gameId, "playAgain")}>🔄 Play Again</button>
                        <button className="btn-secondary w-full" onClick={() => apiAction(gameId, "endGame")}>🚪 End Game</button>
                    </div>
                ) : (
                    <div className="glass-card p-5 text-center">
                        <motion.p className="text-white/40 text-sm" animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 2, repeat: Infinity }}>
                            Waiting for host to start a new game...
                        </motion.p>
                    </div>
                )}
            </motion.div>
        </main>
    );
}
