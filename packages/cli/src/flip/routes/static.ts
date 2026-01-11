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

    // First, check for the bundled path. This is more robust than checking the filename.
    // - Bundled: dist/flip-ui/dist
    let distPath = path.resolve(__dirname, 'flip-ui/dist');

    // If the bundled path doesn't exist, fall back to the unbundled (development) path.
    // - Unbundled: packages/cli/flip-ui/dist
    if (!fs.existsSync(distPath)) {
        distPath = path.resolve(__dirname, '../../../flip-ui/dist');
    }

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
