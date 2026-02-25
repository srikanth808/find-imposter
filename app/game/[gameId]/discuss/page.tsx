"use client";
import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useGame } from "@/hooks/useGame";
import { useLocalPlayer } from "@/lib/gameStore";
import { apiAction } from "@/lib/api";

export default function DiscussPage() {
    const params = useParams();
    const gameId = params.gameId as string;
    const router = useRouter();
    const { game, players } = useGame(gameId);
    const { playerId } = useLocalPlayer();
    const isHost = game?.hostId === playerId;
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (game?.phase === "vote") router.push(`/game/${gameId}/vote`);
    }, [game?.phase, gameId, router]);

    useEffect(() => {
        if (!game?.settings.timerMode || !game?.timerStart) return;
        const duration = game.settings.timerDuration * 1000;
        const endTime = game.timerStart + duration;
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
            setTimeLeft(remaining);
            if (remaining === 0) {
                clearInterval(intervalRef.current!);
                if (isHost) apiAction(gameId, "startVoting");
            }
        }, 500);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [game?.timerStart, game?.settings.timerMode]);

    const duration = game?.settings.timerDuration ?? 60;
    const progress = timeLeft !== null ? timeLeft / duration : 1;
    const circumference = 2 * Math.PI * 54;

    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-4">
            <motion.div className="w-full max-w-sm text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <span className="badge badge-purple font-orbitron mb-6 inline-block">
                    ROUND {game?.currentRound} / {game?.settings.totalRounds}
                </span>
                <motion.div className="text-5xl mb-4" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    🗣️
                </motion.div>
                <h1 className="font-orbitron text-3xl font-black glow-text mb-2">Discuss!</h1>
                <p className="text-white/50 text-sm mb-8">
                    Category is <span className="text-cyan-400 font-semibold">{game?.category}</span>. Who&apos;s the imposter?
                </p>

                {/* Timer ring */}
                {game?.settings.timerMode && timeLeft !== null && (
                    <motion.div className="relative w-36 h-36 mx-auto mb-8" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                            <circle cx="60" cy="60" r="54" fill="none"
                                stroke={timeLeft < 10 ? "#ef4444" : timeLeft < 20 ? "#f59e0b" : "#7c3aed"}
                                strokeWidth="6" strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={circumference * (1 - progress)}
                                style={{ transition: "stroke-dashoffset 0.5s linear, stroke 0.5s" }} />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className={`font-orbitron text-3xl font-black ${timeLeft < 10 ? "text-red-400" : "text-white"}`}>{timeLeft}</span>
                        </div>
                    </motion.div>
                )}

                {/* Tips */}
                <div className="glass-card p-5 mb-8 text-left">
                    <p className="text-xs text-purple-300 font-orbitron tracking-wider mb-3">DISCUSSION TIPS</p>
                    {["Ask everyone to describe the word without saying it", "Watch for vague or suspicious answers", "The imposter only knows the category, not the word!"].map((tip, i) => (
                        <div key={i} className="flex items-start gap-2 mb-2 last:mb-0">
                            <span className="text-purple-400 mt-0.5">→</span>
                            <p className="text-white/50 text-xs">{tip}</p>
                        </div>
                    ))}
                </div>

                {/* Players */}
                <div className="flex flex-wrap gap-2 justify-center mb-8">
                    {players.map((p) => (
                        <div key={p.id} className={`badge ${p.id === playerId ? "badge-purple" : "badge-cyan"}`}>{p.name}</div>
                    ))}
                </div>

                {isHost && (
                    <button className="btn-primary w-full text-lg" onClick={() => apiAction(gameId, "startVoting")}>
                        🗳️ Start Voting
                    </button>
                )}
                {!isHost && <p className="text-white/30 text-sm">Waiting for host to start voting...</p>}
            </motion.div>
        </main>
    );
}
