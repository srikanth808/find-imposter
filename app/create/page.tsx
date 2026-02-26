"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocalPlayer } from "@/lib/gameStore";
import { GameSettings } from "@/lib/gameLogic";
import { apiCreateGame } from "@/lib/api";
import { Category, Difficulty, CATEGORY_INFO } from "@/lib/words";
import Link from "next/link";

const CATEGORIES: { value: Category; label: string; icon: string; description: string }[] = [
    ...Object.entries(CATEGORY_INFO).map(([value, info]) => ({
        value: value as Category,
        label: info.label,
        icon: info.icon,
        description: info.description,
    })),
    { value: "mix" as Category, label: "Mix", icon: "🎲", description: "Random from all categories" },
];

const TIMER_OPTIONS = [
    { value: 30, label: "30s" },
    { value: 60, label: "1 min" },
    { value: 90, label: "90s" },
    { value: 180, label: "3 min" },
];

export default function CreatePage() {
    const router = useRouter();
    const { setPlayer, setGameId } = useLocalPlayer();
    const [hostName, setHostName] = useState("");
    const [settings, setSettings] = useState<GameSettings>({
        category: "mix",
        difficulty: "medium",
        numImposters: 1,
        totalRounds: 3,
        timerMode: true,
        timerDuration: 60,
        minPlayers: 2,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleCreate() {
        if (!hostName.trim()) { setError("Enter your name first!"); return; }
        setLoading(true);
        setError("");
        try {
            const { gameId, roomCode, hostId } = await apiCreateGame(hostName.trim(), settings);
            setPlayer(hostId, hostName.trim());
            setGameId(gameId);
            router.push(`/lobby/${gameId}`);
        } catch (e) {
            setError("Failed to create game. Please try again.");
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
            <motion.div className="w-full max-w-lg" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
                <Link href="/" className="text-purple-400 text-sm mb-6 inline-flex items-center gap-2 hover:text-purple-300">
                    ← Back
                </Link>

                <div className="glass-card p-8 glow-border">
                    <h1 className="font-orbitron text-2xl font-bold glow-text mb-2">Create Game</h1>
                    <p className="text-white/50 text-sm mb-8">Set up your room and invite friends</p>

                    {/* Host name */}
                    <div className="mb-6">
                        <label className="block text-sm text-purple-300 mb-2 font-semibold">Your Name</label>
                        <input className="game-input" placeholder="Enter your name..."
                            value={hostName} onChange={(e) => setHostName(e.target.value)} maxLength={20} />
                    </div>

                    {/* Category */}
                    <div className="mb-6">
                        <label className="block text-sm text-purple-300 mb-3 font-semibold">Category</label>
                        <div className="grid grid-cols-2 gap-2">
                            {CATEGORIES.map((c) => (
                                <button key={c.value}
                                    onClick={() => setSettings((s) => ({ ...s, category: c.value }))}
                                    className={`p-3 rounded-xl border text-left transition-all ${settings.category === c.value
                                        ? "border-purple-500 bg-purple-500/20 text-white"
                                        : "border-white/10 bg-white/5 text-white/50 hover:border-white/20"}`}>
                                    <div className="flex items-center gap-2 font-semibold text-sm">
                                        <span>{c.icon}</span> {c.label}
                                    </div>
                                    <p className="text-xs mt-0.5 opacity-50 truncate">{c.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Difficulty */}
                    <div className="mb-6">
                        <label className="block text-sm text-purple-300 mb-3 font-semibold">Difficulty</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                                <button key={d}
                                    onClick={() => setSettings((s) => ({ ...s, difficulty: d }))}
                                    className={`p-3 rounded-xl border text-sm font-semibold capitalize transition-all ${settings.difficulty === d
                                        ? d === "easy" ? "border-green-500 bg-green-500/20 text-green-300"
                                            : d === "medium" ? "border-yellow-500 bg-yellow-500/20 text-yellow-300"
                                                : "border-red-500 bg-red-500/20 text-red-300"
                                        : "border-white/10 bg-white/5 text-white/50 hover:border-white/20"}`}>
                                    {d === "easy" ? "🟢" : d === "medium" ? "🟡" : "🔴"} {d}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Imposters + Rounds */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm text-purple-300 mb-2 font-semibold">Imposters</label>
                            <div className="flex gap-2">
                                {[1, 2, 3].map((n) => (
                                    <button key={n} onClick={() => setSettings((s) => ({ ...s, numImposters: n }))}
                                        className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${settings.numImposters === n
                                            ? "border-pink-500 bg-pink-500/20 text-pink-300"
                                            : "border-white/10 bg-white/5 text-white/50 hover:border-white/20"}`}>
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-purple-300 mb-2 font-semibold">Rounds</label>
                            <div className="flex gap-2">
                                {[3, 5, 7, 10].map((n) => (
                                    <button key={n} onClick={() => setSettings((s) => ({ ...s, totalRounds: n }))}
                                        className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${settings.totalRounds === n
                                            ? "border-cyan-500 bg-cyan-500/20 text-cyan-300"
                                            : "border-white/10 bg-white/5 text-white/50 hover:border-white/20"}`}>
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Min Players */}
                    <div className="mb-6">
                        <label className="block text-sm text-purple-300 mb-2 font-semibold">Min Players to Start</label>
                        <div className="flex gap-2">
                            {[2, 3, 4, 5].map((n) => (
                                <button key={n} onClick={() => setSettings((s) => ({ ...s, minPlayers: n }))}
                                    className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${settings.minPlayers === n
                                        ? "border-cyan-500 bg-cyan-500/20 text-cyan-300"
                                        : "border-white/10 bg-white/5 text-white/50 hover:border-white/20"}`}>
                                    {n}
                                </button>
                            ))}
                        </div>
                        <p className="text-white/30 text-xs mt-2">Game won&apos;t start until this many players have joined</p>
                    </div>

                    {/* Timer */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm text-purple-300 font-semibold">⏱ Timer Mode</label>
                            <button onClick={() => setSettings((s) => ({ ...s, timerMode: !s.timerMode }))}
                                className={`w-12 h-6 rounded-full transition-all relative ${settings.timerMode ? "bg-purple-600" : "bg-white/10"}`}>
                                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.timerMode ? "left-7" : "left-1"}`} />
                            </button>
                        </div>
                        {settings.timerMode && (
                            <div className="grid grid-cols-4 gap-2">
                                {TIMER_OPTIONS.map((t) => (
                                    <button key={t.value} onClick={() => setSettings((s) => ({ ...s, timerDuration: t.value }))}
                                        className={`py-2 rounded-xl border text-xs font-bold transition-all ${settings.timerDuration === t.value
                                            ? "border-purple-400 bg-purple-500/20 text-purple-200"
                                            : "border-white/10 bg-white/5 text-white/40 hover:border-white/20"}`}>
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {error && <p className="text-red-400 text-sm mb-4">⚠️ {error}</p>}

                    <button className="btn-primary w-full text-lg" onClick={handleCreate} disabled={loading}>
                        {loading ? "Creating..." : "✨ Create Room"}
                    </button>
                </div>
            </motion.div>
        </main>
    );
}
