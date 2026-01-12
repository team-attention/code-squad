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
import { createEventsRouter } from '../routes/events.js';
import { FileWatcher } from '../watcher/FileWatcher.js';
import { SSEManager } from '../events/SSEManager.js';

export interface AppState {
    cwd: string;
    resolve: ((output: string | null) => void | Promise<void>) | null;
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

            // Initialize SSE manager and file watcher
            const sseManager = new SSEManager();
            const fileWatcher = new FileWatcher({ cwd: this.cwd });

            // Set up watcher event handlers
            fileWatcher.onFilesChanged(() => {
                sseManager.broadcast({ type: 'files-changed' });
            });

            fileWatcher.onFileChanged((path) => {
                sseManager.broadcast({ type: 'file-changed', path });
            });

            fileWatcher.onGitChanged(() => {
                sseManager.broadcast({ type: 'git-changed' });
            });

            // Start watching
            fileWatcher.start();

            // API routes
            app.use('/api/files', filesRouter);
            app.use('/api/file', fileRouter);
            app.use('/api/git', gitRouter);
            app.use('/api/submit', submitRouter);
            app.use('/api/cancel', cancelRouter);
            app.use('/api/events', createEventsRouter(sseManager));

            // Static files (fallback to web-ui dist)
            app.use(createStaticRouter());

            const server = http.createServer(app);

            // Set up the shutdown mechanism
            state.resolve = async (output: string | null) => {
                // Cleanup watcher and SSE connections
                await fileWatcher.stop();
                sseManager.closeAll();
                await new Promise<void>(res => server.close(() => res()));
                resolve(output);
            };

            server.listen(this.port, '127.0.0.1', () => {
                console.error(`Server running at http://localhost:${this.port}`);
            });
        });
    }
}

export async function findFreePort(preferred: number, maxPort = 65535): Promise<number> {
    return new Promise((resolve, reject) => {
        if (preferred > maxPort) {
            reject(new Error(`No available port found in range up to ${maxPort}`));
            return;
        }

        const server = net.createServer();

        server.listen(preferred, '127.0.0.1', () => {
            server.close(() => {
                resolve(preferred);
            });
        });

        server.on('error', () => {
            server.close(() => {
                findFreePort(preferred + 1, maxPort).then(resolve).catch(reject);
            });
        });
    });
}
