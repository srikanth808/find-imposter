import { Category, Difficulty, getWord, getImposterHint } from "./words";

export interface Player {
    id: string;
    name: string;
    score: number;
    isReady: boolean;
    hasVoted: boolean;
    isHost: boolean;
    votedFor: string | null;
    isEliminated: boolean;
}

export interface GameSettings {
    category: Category;
    difficulty: Difficulty;
    numImposters: number;
    totalRounds: number;
    timerMode: boolean;
    timerDuration: number; // seconds
}

export interface RoundHistory {
    round: number;
    word: string;
    category: string;
    imposters: string[];
    votedOut: string;
    wasCorrect: boolean;
}

export interface GameState {
    id: string;
    roomCode: string;
    hostId: string;
    phase: "lobby" | "reveal" | "discuss" | "vote" | "result" | "scores" | "ended";
    settings: GameSettings;
    currentRound: number;
    word: string;
    category: string;
    imposters: string[];
    imposterHint: string;
    votes: Record<string, string>; // voterId -> targetId | "skip"
    roundHistory: RoundHistory[];
    timerStart: number | null; // timestamp ms
    createdAt: number;
}

export function generateRoomCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function assignImposters(playerIds: string[], numImposters: number): string[] {
    const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, numImposters);
}

export function tallyVotes(votes: Record<string, string>, players: Player[]): {
    votedOut: string;
    voteCounts: Record<string, number>;
    wasSkip: boolean;
} {
    const counts: Record<string, number> = {};
    let skipCount = 0;

    Object.values(votes).forEach((v) => {
        if (v === "skip") {
            skipCount++;
        } else {
            counts[v] = (counts[v] || 0) + 1;
        }
    });

    // If skips are majority, no one voted out
    const totalVotes = Object.keys(votes).length;
    if (skipCount > totalVotes / 2) {
        return { votedOut: "skip", voteCounts: counts, wasSkip: true };
    }

    // Find player with most votes
    let maxVotes = 0;
    let votedOut = "skip";
    for (const [pid, count] of Object.entries(counts)) {
        if (count > maxVotes) {
            maxVotes = count;
            votedOut = pid;
        }
    }

    return { votedOut, voteCounts: counts, wasSkip: votedOut === "skip" };
}

export function calculateScores(
    players: Player[],
    imposters: string[],
    votedOut: string,
    wasSkip: boolean
): Record<string, number> {
    const deltas: Record<string, number> = {};

    players.forEach((p) => {
        deltas[p.id] = 0;
    });

    if (wasSkip) {
        // Imposter(s) survive - they get bonus
        imposters.forEach((id) => { deltas[id] = (deltas[id] || 0) + 100; });
        return deltas;
    }

    const isImposterCaught = imposters.includes(votedOut);

    if (isImposterCaught) {
        // Crewmates win
        players.forEach((p) => {
            if (!imposters.includes(p.id)) {
                deltas[p.id] = (deltas[p.id] || 0) + 100;
            }
        });
    } else {
        // Imposter survives
        imposters.forEach((id) => { deltas[id] = (deltas[id] || 0) + 150; });
        // Innocent voted out gets sympathy points
        deltas[votedOut] = (deltas[votedOut] || 0); // no penalty
    }

    return deltas;
}

export function buildNewRound(settings: GameSettings, playerIds: string[]) {
    const { word, category } = getWord(settings.category, settings.difficulty);
    const imposters = assignImposters(playerIds, settings.numImposters);
    const imposterHint = getImposterHint(category);
    return { word, category, imposters, imposterHint };
}
