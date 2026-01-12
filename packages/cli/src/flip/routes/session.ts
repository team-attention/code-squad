import { Router, Request, Response } from 'express';
import type { Router as IRouter } from 'express';
import { SessionManager } from '../session/SessionManager.js';

export interface RegisterSessionRequest {
    session_id: string;
    cwd: string;
}

export interface RegisterSessionResponse {
    status: string;
    session_id: string;
}

export interface UnregisterSessionResponse {
    status: string;
}

export function createSessionRouter(sessionManager: SessionManager): IRouter {
    const router: IRouter = Router();

    // POST /api/session/register - Register a new session
    router.post('/register', (req: Request, res: Response) => {
        const body = req.body as RegisterSessionRequest;

        if (!body.session_id || !body.cwd) {
            res.status(400).json({ error: 'Missing session_id or cwd' });
            return;
        }

        // Clear idle timer on first session registration
        if (!sessionManager.hasSessions && req.app.locals.clearIdleTimer) {
            req.app.locals.clearIdleTimer();
        }

        sessionManager.registerSession(body.session_id, body.cwd);

        const response: RegisterSessionResponse = {
            status: 'ok',
            session_id: body.session_id,
        };

        res.json(response);
    });

    // POST /api/session/unregister - Unregister a session
    router.post('/unregister', async (req: Request, res: Response) => {
        const body = req.body as { session_id: string };

        if (!body.session_id) {
            res.status(400).json({ error: 'Missing session_id' });
            return;
        }

        await sessionManager.unregisterSession(body.session_id);

        const response: UnregisterSessionResponse = {
            status: 'ok',
        };

        res.json(response);
    });

    // GET /api/session/info?session_id=xxx - Get session info
    router.get('/info', (req: Request, res: Response) => {
        const sessionId = req.query.session_id as string;

        if (!sessionId) {
            res.status(400).json({ error: 'Missing session_id' });
            return;
        }

        const session = sessionManager.getSession(sessionId);

        if (!session) {
            res.status(404).json({ error: 'Session not found' });
            return;
        }

        res.json({
            session_id: session.id,
            cwd: session.cwd,
            lastActivity: session.lastActivity,
        });
    });

    return router;
}
