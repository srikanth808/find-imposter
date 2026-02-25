"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useGame } from "@/hooks/useGame";
import { useLocalPlayer } from "@/lib/gameStore";
import { apiAction } from "@/lib/api";

export default function VotePage() {
    const params = useParams();
    const gameId = params.gameId as string;
    const router = useRouter();
    const { game, players } = useGame(gameId);
    const { playerId } = useLocalPlayer();
    const [selected, setSelected] = useState<string | null>(null);
    const [confirmed, setConfirmed] = useState(false);

    const me = players.find((p) => p.id === playerId);
    const votedCount = players.filter((p) => p.hasVoted).length;

    useEffect(() => {
        if (game?.phase === "result") router.push(`/game/${gameId}/result`);
    }, [game?.phase, gameId, router]);

    async function castVote(targetId: string) {
        if (confirmed || !playerId) return;
        setSelected(targetId);
        setConfirmed(true);
        await apiAction(gameId, "vote", { playerId, targetId });
    }

    async function skipVote() {
        if (confirmed || !playerId) return;
        setSelected("skip");
        setConfirmed(true);
        await apiAction(gameId, "vote", { playerId, targetId: "skip" });
    }

    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
            <motion.div className="w-full max-w-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="text-center mb-6">
                    <span className="badge badge-purple font-orbitron">ROUND {game?.currentRound} — VOTE</span>
                    <h1 className="font-orbitron text-2xl font-black glow-pink mt-3">Who&apos;s the Imposter?</h1>
                    <p className="text-white/40 text-sm mt-1">Vote for who you think is faking it</p>
                </div>

                {/* Vote progress dots */}
                <div className="glass-card p-3 mb-5 flex items-center justify-between">
                    <span className="text-xs text-white/40">Votes cast</span>
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                            {players.map((p) => (
                                <div key={p.id} className={`w-2 h-2 rounded-full transition-colors ${p.hasVoted ? "bg-green-400" : "bg-white/20"}`} />
                            ))}
                        </div>
                        <span className="text-xs text-purple-300 font-orbitron">{votedCount}/{players.length}</span>
                    </div>
                </div>

                {/* Player vote cards */}
                <div className="space-y-3 mb-5">
                    <AnimatePresence>
                        {players.filter((p) => p.id !== playerId).map((p, i) => (
                            <motion.button key={p.id}
                                onClick={() => !confirmed && castVote(p.id)}
                                disabled={confirmed}
                                className={`w-full p-4 rounded-2xl border transition-all duration-300 flex items-center gap-4 ${selected === p.id
                                    ? "border-pink-500 bg-pink-500/20 glow-border-pink"
                                    : confirmed ? "border-white/5 bg-white/5 opacity-40"
                                        : "border-white/10 bg-white/5 hover:border-purple-500/50 hover:bg-purple-500/10"}`}
                                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.07 }} whileHover={!confirmed ? { scale: 1.02 } : {}}
                                whileTap={!confirmed ? { scale: 0.98 } : {}}>
                                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                                    style={{ background: `hsl(${(i * 70) % 360}, 65%, 40%)` }}>
                                    {p.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-white font-semibold flex-1 text-left">{p.name}</span>
                                {p.hasVoted && <span className="text-green-400 text-xs">✓ voted</span>}
                                {selected === p.id && <span className="text-pink-400 text-lg">👈</span>}
                            </motion.button>
                        ))}
                    </AnimatePresence>
                </div>

                {!confirmed ? (
                    <button className="btn-secondary w-full" onClick={skipVote}>⏭ Skip Vote</button>
                ) : (
                    <motion.div className="glass-card p-4 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <p className="text-green-400 font-semibold text-sm">
                            {selected === "skip" ? "⏭ You skipped" : `✅ Voted for ${players.find((p) => p.id === selected)?.name}`}
                        </p>
                        <p className="text-white/30 text-xs mt-1">Waiting for others... ({votedCount}/{players.length})</p>
                    </motion.div>
                )}
            </motion.div>
        </main>
    );
}
