import { Router, Request, Response } from 'express';
import type { Router as IRouter } from 'express';
import { AppState } from '../server/Server.js';

export interface CancelResponse {
    status: string;
}

const router: IRouter = Router();

// POST /api/cancel
router.post('/', (req: Request, res: Response) => {
    const state = req.app.locals.state as AppState;

    // Send response before shutdown
    res.json({ status: 'ok' } as CancelResponse);

    // Trigger shutdown without output
    if (state.resolve) {
        state.resolve(null);
    }
});

export { router as cancelRouter };
