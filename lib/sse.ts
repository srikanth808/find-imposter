/**
 * SSE (Server-Sent Events) broadcaster.
 * Each game room has a set of active subscriber response streams.
 * When game state changes, all subscribers get pushed the new state.
 */

type Subscriber = {
    controller: ReadableStreamDefaultController;
    gameId: string;
};

declare global {
    // eslint-disable-next-line no-var
    var __sseSubscribers: Map<string, Set<Subscriber>> | undefined;
}

export const sseSubscribers: Map<string, Set<Subscriber>> =
    global.__sseSubscribers ?? (global.__sseSubscribers = new Map());

export function broadcastGame(gameId: string, data: object) {
    const subs = sseSubscribers.get(gameId);
    if (!subs) return;
    const msg = `data: ${JSON.stringify(data)}\n\n`;
    const encoder = new TextEncoder();
    const dead: Subscriber[] = [];
    subs.forEach((sub) => {
        try {
            sub.controller.enqueue(encoder.encode(msg));
        } catch {
            dead.push(sub);
        }
    });
    dead.forEach((d) => subs.delete(d));
}

export function addSubscriber(gameId: string, sub: Subscriber) {
    if (!sseSubscribers.has(gameId)) sseSubscribers.set(gameId, new Set());
    sseSubscribers.get(gameId)!.add(sub);
}

export function removeSubscriber(gameId: string, sub: Subscriber) {
    sseSubscribers.get(gameId)?.delete(sub);
}
