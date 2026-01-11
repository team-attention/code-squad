import express, { Application } from 'express';
import cors from 'cors';
import http from 'http';
import net from 'net';

import { filesRouter } from '../routes/files.js';
import { fileRouter } from '../routes/file.js';
import { gitRouter } from '../routes/git.js';
import { submitRouter } from '../routes/submit.js';
import { cancelRouter } from '../routes/cancel.js';
import { createStaticRouter } from '../routes/static.js';

export interface AppState {
    cwd: string;
    resolve: ((output: string | null) => void) | null;
}

export class Server {
    private cwd: string;
    private port: number;

    constructor(cwd: string, port: number) {
        this.cwd = cwd;
        this.port = port;
    }

    async run(): Promise<string | null> {
        return new Promise((resolve) => {
            const state: AppState = {
                cwd: this.cwd,
                resolve: null,
            };

            const app: Application = express();

            // Middleware
            app.use(cors());
            app.use(express.json());

            // Store state in app locals
            app.locals.state = state;

            // API routes
            app.use('/api/files', filesRouter);
            app.use('/api/file', fileRouter);
            app.use('/api/git', gitRouter);
            app.use('/api/submit', submitRouter);
            app.use('/api/cancel', cancelRouter);

            // Static files (fallback to web-ui dist)
            app.use(createStaticRouter());

            const server = http.createServer(app);

            // Set up the shutdown mechanism
            state.resolve = (output: string | null) => {
                server.close();
                resolve(output);
            };

            server.listen(this.port, '127.0.0.1', () => {
                console.log(`Server running at http://localhost:${this.port}`);
            });
        });
    }
}

export async function findFreePort(preferred: number): Promise<number> {
    return new Promise((resolve) => {
        const server = net.createServer();

        server.listen(preferred, '127.0.0.1', () => {
            server.close(() => {
                resolve(preferred);
            });
        });

        server.on('error', () => {
            // Port in use, try next
            findFreePort(preferred + 1).then(resolve);
        });
    });
}
