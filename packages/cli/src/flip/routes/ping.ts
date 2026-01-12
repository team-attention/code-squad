import { Router, Request, Response } from 'express';
import type { Router as IRouter } from 'express';
import { SERVER_ID } from '../server/Server.js';

export interface PingResponse {
    id: string;
    version: string;
}

export function createPingRouter(): IRouter {
    const router: IRouter = Router();

    // GET /api/ping - Server identification for discovery
    router.get('/', (_req: Request, res: Response) => {
        const response: PingResponse = {
            id: SERVER_ID,
            version: '1.0.0',
        };
        res.json(response);
    });

    return router;
}
