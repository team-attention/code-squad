import { FileWatcher } from '../watcher/FileWatcher.js';

export interface Session {
    /** Session ID (tty path, e.g., /dev/ttys001) */
    id: string;
    /** Working directory for this session */
    cwd: string;
    /** FileWatcher instance for this session */
    watcher: FileWatcher;
    /** Changed files since last poll (for polling-based sync) */
    pendingChanges: PendingChanges;
    /** Timeout timer for session expiration */
    timeoutTimer: ReturnType<typeof setTimeout> | null;
}

export interface PendingChanges {
    filesChanged: boolean;
    gitChanged: boolean;
    changedFiles: Set<string>;
}

export interface SessionManagerOptions {
    /** Session timeout in ms. Sessions are cleaned up after this period of inactivity. */
    sessionTimeoutMs: number;
    /** Callback when all sessions are gone */
    onAllSessionsGone?: () => void;
}

const log = (...args: unknown[]) => console.error(...args);

export class SessionManager {
    private sessions: Map<string, Session> = new Map();
    private options: SessionManagerOptions;

    constructor(options: SessionManagerOptions) {
        this.options = options;
    }

    /**
     * Start the session manager (no-op, kept for API compatibility)
     */
    start(): void {
        // No longer uses periodic cleanup - each session has its own timeout
    }

    /**
     * Stop the session manager and clean up all sessions
     */
    async stop(): Promise<void> {
        // Clear all session timeouts and stop watchers
        const stopPromises = Array.from(this.sessions.values()).map(session => {
            if (session.timeoutTimer) {
                clearTimeout(session.timeoutTimer);
            }
            return session.watcher.stop();
        });
        await Promise.all(stopPromises);
        this.sessions.clear();
    }

    /**
     * Register a new session or update existing one
     */
    registerSession(sessionId: string, cwd: string): Session {
        const existing = this.sessions.get(sessionId);

        if (existing) {
            // Reset timeout on activity
            this.resetSessionTimeout(sessionId);

            // If cwd changed, need to restart watcher
            if (existing.cwd !== cwd) {
                existing.watcher.stop();
                existing.cwd = cwd;
                existing.watcher = this.createWatcher(sessionId, cwd);
                existing.pendingChanges = this.createEmptyPendingChanges();
            }

            return existing;
        }

        // Create new session
        const watcher = this.createWatcher(sessionId, cwd);
        const session: Session = {
            id: sessionId,
            cwd,
            watcher,
            pendingChanges: this.createEmptyPendingChanges(),
            timeoutTimer: null,
        };

        this.sessions.set(sessionId, session);
        this.resetSessionTimeout(sessionId);
        log(`[SessionManager] Session registered: ${sessionId} (cwd: ${cwd})`);

        return session;
    }

    /**
     * Get a session by ID and reset timeout
     */
    getSession(sessionId: string): Session | undefined {
        const session = this.sessions.get(sessionId);
        if (session) {
            this.resetSessionTimeout(sessionId);
        }
        return session;
    }

    /**
     * Touch session to reset timeout (called on every API request)
     */
    touchSession(sessionId: string): void {
        this.resetSessionTimeout(sessionId);
    }

    /**
     * Unregister a session (e.g., on cancel/submit/timeout)
     */
    async unregisterSession(sessionId: string): Promise<void> {
        const session = this.sessions.get(sessionId);
        if (session) {
            // Clear timeout timer
            if (session.timeoutTimer) {
                clearTimeout(session.timeoutTimer);
            }
            await session.watcher.stop();
            this.sessions.delete(sessionId);
            log(`[SessionManager] Session unregistered: ${sessionId}`);

            if (this.sessions.size === 0 && this.options.onAllSessionsGone) {
                this.options.onAllSessionsGone();
            }
        }
    }

    /**
     * Get pending changes for a session and clear them
     */
    consumePendingChanges(sessionId: string): PendingChanges | null {
        const session = this.sessions.get(sessionId);
        if (!session) return null;

        const changes = { ...session.pendingChanges };
        changes.changedFiles = new Set(session.pendingChanges.changedFiles);

        // Reset pending changes
        session.pendingChanges = this.createEmptyPendingChanges();

        return changes;
    }

    /**
     * Get number of active sessions
     */
    get sessionCount(): number {
        return this.sessions.size;
    }

    /**
     * Check if any sessions exist
     */
    get hasSessions(): boolean {
        return this.sessions.size > 0;
    }

    private createWatcher(sessionId: string, cwd: string): FileWatcher {
        const watcher = new FileWatcher({ cwd });

        watcher.onFilesChanged(() => {
            const session = this.sessions.get(sessionId);
            if (session) {
                session.pendingChanges.filesChanged = true;
            }
        });

        watcher.onFileChanged((filePath) => {
            const session = this.sessions.get(sessionId);
            if (session) {
                session.pendingChanges.changedFiles.add(filePath);
            }
        });

        watcher.onGitChanged(() => {
            const session = this.sessions.get(sessionId);
            if (session) {
                session.pendingChanges.gitChanged = true;
            }
        });

        watcher.start();
        return watcher;
    }

    private createEmptyPendingChanges(): PendingChanges {
        return {
            filesChanged: false,
            gitChanged: false,
            changedFiles: new Set(),
        };
    }

    /**
     * Reset the timeout timer for a session.
     * Called on every activity (register, poll, etc.)
     */
    private resetSessionTimeout(sessionId: string): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        // Clear existing timeout
        if (session.timeoutTimer) {
            clearTimeout(session.timeoutTimer);
        }

        // Set new timeout
        session.timeoutTimer = setTimeout(() => {
            log(`[SessionManager] Session timed out: ${sessionId}`);
            this.unregisterSession(sessionId).catch(error => {
                log(`[SessionManager] Error during session unregister for ${sessionId}:`, error);
            });
        }, this.options.sessionTimeoutMs);
    }
}
