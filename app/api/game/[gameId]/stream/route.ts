import { NextRequest } from "next/server";
import { gameStore } from "@/lib/store";
import { addSubscriber, removeSubscriber, broadcastGame } from "@/lib/sse";

type Params = { params: Promise<{ gameId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
    const { gameId } = await params;
    const g = gameStore.get(gameId);
    if (!g) return new Response("not found", { status: 404 });

    let subsController: ReadableStreamDefaultController;

    const stream = new ReadableStream({
        start(controller) {
            subsController = controller;
            const sub = { controller, gameId };
            addSubscriber(gameId, sub);

            // Send current state immediately on connect
            const { players, ...game } = g;
            const msg = `data: ${JSON.stringify({ game, players: Object.values(players) })}\n\n`;
            controller.enqueue(new TextEncoder().encode(msg));

            // Cleanup on disconnect
            _req.signal.addEventListener("abort", () => {
                removeSubscriber(gameId, sub);
                try { controller.close(); } catch { /* already closed */ }
            });
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
        },
    });
}
