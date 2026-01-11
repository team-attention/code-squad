import { Router, Request, Response } from 'express';
import type { Router as IRouter } from 'express';
import { SSEManager } from '../events/SSEManager.js';

export function createEventsRouter(sseManager: SSEManager): IRouter {
    const router: IRouter = Router();

    // GET /api/events - SSE endpoint for real-time updates
    router.get('/', (req: Request, res: Response) => {
        // Set SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

        // Send initial connection message
        res.write('data: {"type":"connected"}\n\n');

        // Register client
        sseManager.addClient(res);

        // Keep connection alive with heartbeat
        const heartbeat = setInterval(() => {
            res.write(':heartbeat\n\n');
        }, 30000);

        // Cleanup on close (removeClient is handled by SSEManager)
        req.on('close', () => {
            clearInterval(heartbeat);
        });
    });

    return router;
}
