import { Router, Request, Response } from 'express';
import type { Router as IRouter } from 'express';
import { SessionManager } from '../session/SessionManager.js';

export interface CancelRequest {
    session_id: string;
}

export interface CancelResponse {
    status: string;
}

const router: IRouter = Router();

// POST /api/cancel
router.post('/', async (req: Request, res: Response) => {
    const sessionManager = req.app.locals.sessionManager as SessionManager;
    const body = req.body as CancelRequest;

    if (!body.session_id) {
        res.status(400).json({ error: 'Missing session_id' });
        return;
    }

    // Send response before cleanup
    res.json({ status: 'ok' } as CancelResponse);

    // Unregister the session
    await sessionManager.unregisterSession(body.session_id);
});

export { router as cancelRouter };
