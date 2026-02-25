"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";

const floatingEmojis = ["🕵️", "🎭", "🔍", "💀", "👁️", "🎯", "🃏", "🎪"];

export default function HomePage() {
  const [particles, setParticles] = useState<{ x: number; y: number; emoji: string; delay: number }[]>([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 12 }, (_, i) => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        emoji: floatingEmojis[i % floatingEmojis.length],
        delay: Math.random() * 4,
      }))
    );
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* Floating background emojis */}
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute text-2xl pointer-events-none select-none opacity-20"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
          animate={{ y: [-20, 20, -20], rotate: [-10, 10, -10] }}
          transition={{ duration: 4 + p.delay, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
        >
          {p.emoji}
        </motion.div>
      ))}

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
        style={{ background: "radial-gradient(circle, #7c3aed, transparent)" }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-10 blur-3xl"
        style={{ background: "radial-gradient(circle, #ec4899, transparent)" }} />

      <motion.div
        className="text-center z-10 max-w-2xl w-full"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Eye icon */}
        <motion.div
          className="text-8xl mb-6 float inline-block"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          🕵️
        </motion.div>

        <h1 className="font-orbitron text-5xl md:text-7xl font-black mb-4 glow-text"
          style={{ background: "linear-gradient(135deg, #c4b5fd, #f9a8d4, #67e8f9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          FIND THE<br />IMPOSTER
        </h1>

        <motion.p
          className="text-lg text-purple-200/70 mb-10 max-w-md mx-auto leading-relaxed"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        >
          A real-time multiplayer party game. One word. One secret.
          <span className="text-pink-400 font-semibold"> Can you spot the imposter?</span>
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        >
          <Link href="/create">
            <button className="btn-primary text-lg px-10 py-4 pulse-glow w-full sm:w-auto">
              🎮 Create Game
            </button>
          </Link>
          <Link href="/join">
            <button className="btn-secondary text-lg px-10 py-4 w-full sm:w-auto">
              🔑 Join Game
            </button>
          </Link>
        </motion.div>

        {/* How to play */}
        <motion.div
          className="glass-card mt-14 p-6 text-left"
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
        >
          <h2 className="font-orbitron text-sm font-bold text-purple-300 mb-4 tracking-widest">HOW TO PLAY</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { icon: "🎮", text: "Host creates a room and shares the code" },
              { icon: "📱", text: "Friends join on their own phones" },
              { icon: "🕵️", text: "Imposters get a hint, crewmates get the word" },
              { icon: "🗣️", text: "Discuss, vote, and catch the imposter!" },
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-2xl">{step.icon}</span>
                <p className="text-sm text-white/60 leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </main>
  );
}
