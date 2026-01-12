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
import { createPingRouter } from '../routes/ping.js';
import { createSessionRouter } from '../routes/session.js';
import { createChangesRouter } from '../routes/changes.js';
import { SessionManager } from '../session/SessionManager.js';

const log = (...args: unknown[]) => console.error(...args);

/** Server identification string for ping endpoint */
export const SERVER_ID = 'csq-flip';

export interface ServerOptions {
    /** Session timeout in ms. Default: 30000 (30 seconds) */
    sessionTimeoutMs?: number;
    /** Idle timeout in ms. Server shuts down if no session is registered within this time. 0 = no timeout. */
    idleTimeout?: number;
}

/**
 * Singleton flip server that manages multiple sessions
 */
export class Server {
    private port: number;
    private options: ServerOptions;
    private app: Application | null = null;
    private server: http.Server | null = null;
    private sessionManager: SessionManager | null = null;
    private resolveShutdown: ((value: void) => void) | null = null;

    constructor(port: number, options: ServerOptions = {}) {
        this.port = port;
        this.options = {
            sessionTimeoutMs: options.sessionTimeoutMs ?? 30000,
            idleTimeout: options.idleTimeout ?? 0,
        };
    }

    /**
     * Start the server and return a promise that resolves when server shuts down
     */
    async run(): Promise<void> {
        return new Promise((resolve) => {
            this.resolveShutdown = resolve;

            this.app = express();

            // Middleware
            this.app.use(cors());
            this.app.use(express.json());

            // Initialize session manager
            this.sessionManager = new SessionManager({
                sessionTimeoutMs: this.options.sessionTimeoutMs!,
                onAllSessionsGone: () => {
                    log('[Server] All sessions gone, shutting down...');
                    this.shutdown();
                },
            });
            this.sessionManager.start();

            // Store session manager in app locals
            this.app.locals.sessionManager = this.sessionManager;

            // API routes
            this.app.use('/api/ping', createPingRouter());
            this.app.use('/api/session', createSessionRouter(this.sessionManager));
            this.app.use('/api/changes', createChangesRouter(this.sessionManager));
            this.app.use('/api/files', filesRouter);
            this.app.use('/api/file', fileRouter);
            this.app.use('/api/git', gitRouter);
            this.app.use('/api/submit', submitRouter);
            this.app.use('/api/cancel', cancelRouter);

            // Static files (fallback to web-ui dist)
            this.app.use(createStaticRouter());

            this.server = http.createServer(this.app);

            // Handle SIGINT/SIGTERM for graceful shutdown
            const signalHandler = () => {
                log('\nShutting down...');
                this.shutdown();
            };
            process.on('SIGINT', signalHandler);
            process.on('SIGTERM', signalHandler);

            // Idle timeout - shutdown if no session is registered
            let idleTimer: ReturnType<typeof setTimeout> | null = null;
            if (this.options.idleTimeout && this.options.idleTimeout > 0) {
                idleTimer = setTimeout(() => {
                    if (!this.sessionManager?.hasSessions) {
                        log('\nNo session registered, shutting down...');
                        this.shutdown();
                    }
                }, this.options.idleTimeout);

                // Clear timeout when first session is registered
                // This is handled in session registration
            }

            // Store idle timer for cleanup
            this.app.locals.idleTimer = idleTimer;
            this.app.locals.clearIdleTimer = () => {
                if (idleTimer) {
                    clearTimeout(idleTimer);
                    idleTimer = null;
                    this.app!.locals.idleTimer = null;
                }
            };

            this.server.listen(this.port, '127.0.0.1', () => {
                log(`[Server] Running at http://localhost:${this.port}`);
            });
        });
    }

    /**
     * Shutdown the server gracefully
     */
    async shutdown(): Promise<void> {
        if (!this.server) return;

        // Clear idle timer if exists
        if (this.app?.locals.idleTimer) {
            clearTimeout(this.app.locals.idleTimer);
        }

        // Stop session manager (stops all watchers)
        if (this.sessionManager) {
            await this.sessionManager.stop();
        }

        // Close HTTP server
        await new Promise<void>(res => {
            this.server!.close(() => res());
        });

        log('[Server] Shutdown complete');

        if (this.resolveShutdown) {
            this.resolveShutdown();
        }
    }

    /**
     * Get the session manager
     */
    getSessionManager(): SessionManager | null {
        return this.sessionManager;
    }
}

/**
 * Find an available port starting from the preferred port
 */
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

/**
 * Check if a csq-flip server is running on the given port
 */
export async function isFlipServerRunning(port: number, timeoutMs = 1000): Promise<boolean> {
    return new Promise((resolve) => {
        const req = http.request({
            hostname: '127.0.0.1',
            port,
            path: '/api/ping',
            method: 'GET',
            timeout: timeoutMs,
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json.id === SERVER_ID);
                } catch {
                    resolve(false);
                }
            });
        });

        req.on('error', () => resolve(false));
        req.on('timeout', () => {
            req.destroy();
            resolve(false);
        });

        req.end();
    });
}

/**
 * Find an existing csq-flip server in the port range
 */
export async function findExistingServer(startPort: number, endPort: number): Promise<number | null> {
    for (let port = startPort; port <= endPort; port++) {
        if (await isFlipServerRunning(port)) {
            return port;
        }
    }
    return null;
}
