import { Router, Request, Response } from 'express';
import type { Router as IRouter } from 'express';
import { SessionManager, PendingChanges } from '../session/SessionManager.js';

export interface ChangesResponse {
    filesChanged: boolean;
    gitChanged: boolean;
    changedFiles: string[];
}

export function createChangesRouter(sessionManager: SessionManager): IRouter {
    const router: IRouter = Router();

    // GET /api/changes?session_id=xxx - Get pending changes for a session (polling endpoint)
    router.get('/', (req: Request, res: Response) => {
        const sessionId = req.query.session_id as string;

        if (!sessionId) {
            res.status(400).json({ error: 'Missing session_id' });
            return;
        }

        // Touch session to update activity
        sessionManager.touchSession(sessionId);

        const changes = sessionManager.consumePendingChanges(sessionId);

        if (!changes) {
            res.status(404).json({ error: 'Session not found' });
            return;
        }

        const response: ChangesResponse = {
            filesChanged: changes.filesChanged,
            gitChanged: changes.gitChanged,
            changedFiles: Array.from(changes.changedFiles),
        };

        res.json(response);
    });

    return router;
}
