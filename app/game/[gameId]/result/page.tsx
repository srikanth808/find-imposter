"use client";
import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useGame } from "@/hooks/useGame";
import { useLocalPlayer } from "@/lib/gameStore";
import { apiAction } from "@/lib/api";
import confetti from "canvas-confetti";

export default function ResultPage() {
    const params = useParams();
    const gameId = params.gameId as string;
    const router = useRouter();
    const { game, players } = useGame(gameId);
    const { playerId } = useLocalPlayer();
    const isHost = game?.hostId === playerId;
    const confettiFired = useRef(false);

    const gameAny = game as any;
    const votedOutId = gameAny?.lastVotedOut as string | undefined;
    const wasSkip = gameAny?.lastWasSkip as boolean | undefined;
    const votedOutPlayer = players.find((p) => p.id === votedOutId);
    const wasImposterCaught = game?.imposters.includes(votedOutId ?? "") ?? false;

    useEffect(() => {
        if (game?.phase === "scores") router.push(`/game/${gameId}/scores`);
        if (game?.phase === "reveal") router.push(`/game/${gameId}/reveal`);
        if (game?.phase === "lobby") router.push(`/lobby/${gameId}`);
    }, [game?.phase, gameId, router]);

    useEffect(() => {
        if (!confettiFired.current && wasImposterCaught && !wasSkip) {
            confettiFired.current = true;
            setTimeout(() => {
                confetti({ particleCount: 150, spread: 80, origin: { y: 0.4 }, colors: ["#7c3aed", "#ec4899", "#06b6d4"] });
            }, 800);
        }
    }, [wasImposterCaught, wasSkip]);

    const imposters = players.filter((p) => game?.imposters.includes(p.id));
    const isLastRound = game ? game.currentRound >= game.settings.totalRounds : false;

    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
            <motion.div className="w-full max-w-md text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <span className="badge badge-purple font-orbitron mb-4 inline-block">
                    ROUND {game?.currentRound} — RESULT
                </span>

                {/* Main result card */}
                <motion.div className={`glass-card p-8 mb-6 ${wasSkip ? "glow-border" : wasImposterCaught ? "glow-border-cyan" : "glow-border-red"}`}
                    initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", damping: 12, delay: 0.2 }}>
                    {wasSkip ? (
                        <>
                            <div className="text-6xl mb-4">⏭️</div>
                            <h2 className="font-orbitron text-2xl font-black text-white mb-2">Round Skipped</h2>
                            <p className="text-white/50 text-sm">No one was voted out. The imposter lives on...</p>
                        </>
                    ) : (
                        <>
                            <motion.div className="text-7xl mb-4" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.5 }}>
                                {wasImposterCaught ? "🎉" : "💀"}
                            </motion.div>
                            <p className="text-white/50 text-sm mb-1">The group voted out</p>
                            <h2 className="font-orbitron text-3xl font-black mb-3"
                                style={{ color: wasImposterCaught ? "#67e8f9" : "#fca5a5" }}>
                                {votedOutPlayer?.name ?? "Unknown"}
                            </h2>
                            {wasImposterCaught ? (
                                <div>
                                    <span className="badge badge-green text-base px-4 py-2 mb-3 inline-block">✅ IMPOSTER CAUGHT!</span>
                                    <p className="text-green-300/70 text-sm">Crewmates win this round! +100 pts each</p>
                                </div>
                            ) : (
                                <div>
                                    <span className="badge badge-red text-base px-4 py-2 mb-3 inline-block">❌ WRONG VOTE!</span>
                                    <p className="text-red-300/70 text-sm">The imposter survives! +150 pts for imposters</p>
                                </div>
                            )}
                        </>
                    )}
                </motion.div>

                {/* Imposter reveal */}
                <motion.div className="glass-card p-5 mb-6"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                    <p className="text-xs text-purple-300 font-orbitron tracking-wider mb-3">THE IMPOSTERS WERE</p>
                    <div className="flex flex-wrap gap-2 justify-center mb-3">
                        {imposters.map((p) => (
                            <span key={p.id} className="badge badge-red px-3 py-1">🕵️ {p.name}</span>
                        ))}
                    </div>
                    <div className="divider my-3" />
                    <p className="text-white/40 text-sm">
                        Secret word: <span className="text-cyan-400 font-bold font-orbitron">{game?.word}</span>
                        <span className="text-white/30 ml-1">({game?.category})</span>
                    </p>
                </motion.div>

                {/* Scores */}
                <motion.div className="glass-card p-5 mb-8"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
                    <p className="text-xs text-purple-300 font-orbitron tracking-wider mb-4">CURRENT SCORES</p>
                    <div className="space-y-2">
                        {[...players].sort((a, b) => b.score - a.score).map((p, i) => (
                            <div key={p.id} className="flex items-center gap-3">
                                <span className="text-white/30 text-xs w-4">{i + 1}</span>
                                <span className="text-white text-sm font-medium flex-1">{p.name}</span>
                                {game?.imposters.includes(p.id) && <span className="badge badge-red text-xs">🕵️</span>}
                                {p.id === playerId && <span className="badge badge-purple text-xs">you</span>}
                                <span className="font-orbitron text-sm font-bold text-cyan-300">{p.score} pts</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {isHost ? (
                    <button className="btn-primary w-full text-lg" onClick={() => apiAction(gameId, "nextRound")}>
                        {isLastRound ? "🏆 View Final Scores" : `🔄 Next Round (${(game?.currentRound ?? 0) + 1}/${game?.settings.totalRounds})`}
                    </button>
                ) : (
                    <p className="text-white/30 text-sm">Waiting for host to continue...</p>
                )}
            </motion.div>
        </main>
    );
}
