import { Router, Request, Response } from 'express';
import type { Router as IRouter } from 'express';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

export function createStaticRouter(): IRouter {
    const router: IRouter = Router();

    // Get __dirname equivalent in ESM
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // Detect if running from bundled index.js or unbundled source
    // - Bundled: __filename = dist/index.js → flip-ui is at dist/flip-ui/dist
    // - Unbundled: __filename = src/flip/routes/static.ts → flip-ui is at packages/cli/flip-ui/dist
    const isBundled = path.basename(__filename) === 'index.js';
    const distPath = isBundled
        ? path.resolve(__dirname, 'flip-ui/dist')
        : path.resolve(__dirname, '../../../flip-ui/dist');

    // Check if dist exists (for development vs production)
    if (fs.existsSync(distPath)) {
        // Serve static files
        router.use(express.static(distPath));

        // SPA fallback - serve index.html for all non-API routes
        router.get('*', (req: Request, res: Response) => {
            const indexPath = path.join(distPath, 'index.html');
            if (fs.existsSync(indexPath)) {
                res.sendFile(indexPath);
            } else {
                res.status(404).send('Not Found');
            }
        });
    } else {
        // Development mode - redirect to Vite dev server
        router.get('*', (req: Request, res: Response) => {
            res.redirect(`http://localhost:5173${req.url}`);
        });
    }

    return router;
}
