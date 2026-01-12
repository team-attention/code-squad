import { FileWatcher } from '../watcher/FileWatcher.js';

export interface Session {
    /** Session ID (tty path, e.g., /dev/ttys001) */
    id: string;
    /** Working directory for this session */
    cwd: string;
    /** FileWatcher instance for this session */
    watcher: FileWatcher;
    /** Last activity timestamp (ms since epoch) */
    lastActivity: number;
    /** Changed files since last poll (for polling-based sync) */
    pendingChanges: PendingChanges;
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
    private cleanupInterval: ReturnType<typeof setInterval> | null = null;

    constructor(options: SessionManagerOptions) {
        this.options = options;
    }

    /**
     * Start the session cleanup timer
     */
    start(): void {
        // Check for timed out sessions every 5 seconds
        this.cleanupInterval = setInterval(() => {
            this.cleanupTimedOutSessions();
        }, 5000);
    }

    /**
     * Stop the session manager and clean up all sessions
     */
    async stop(): Promise<void> {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }

        // Stop all watchers
        const stopPromises = Array.from(this.sessions.values()).map(session =>
            session.watcher.stop()
        );
        await Promise.all(stopPromises);
        this.sessions.clear();
    }

    /**
     * Register a new session or update existing one
     */
    registerSession(sessionId: string, cwd: string): Session {
        const existing = this.sessions.get(sessionId);

        if (existing) {
            // Update activity timestamp
            existing.lastActivity = Date.now();

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
            lastActivity: Date.now(),
            pendingChanges: this.createEmptyPendingChanges(),
        };

        this.sessions.set(sessionId, session);
        log(`[SessionManager] Session registered: ${sessionId} (cwd: ${cwd})`);

        return session;
    }

    /**
     * Get a session by ID and update activity
     */
    getSession(sessionId: string): Session | undefined {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.lastActivity = Date.now();
        }
        return session;
    }

    /**
     * Touch session to update activity timestamp (called on every API request)
     */
    touchSession(sessionId: string): void {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.lastActivity = Date.now();
        }
    }

    /**
     * Unregister a session (e.g., on cancel/submit)
     */
    async unregisterSession(sessionId: string): Promise<void> {
        const session = this.sessions.get(sessionId);
        if (session) {
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

    private cleanupTimedOutSessions(): void {
        const now = Date.now();
        const timedOut: string[] = [];

        for (const [sessionId, session] of this.sessions) {
            if (now - session.lastActivity > this.options.sessionTimeoutMs) {
                timedOut.push(sessionId);
            }
        }

        for (const sessionId of timedOut) {
            log(`[SessionManager] Session timed out: ${sessionId}`);
            this.unregisterSession(sessionId);
        }
    }
}
