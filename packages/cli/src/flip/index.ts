import { Server, findFreePort, findExistingServer, isFlipServerRunning } from './server/Server.js';
import open from 'open';
import path from 'path';
import fs from 'fs';
import os from 'os';
import http from 'http';
import { execSync } from 'child_process';
import { copyToClipboard } from './output/clipboard.js';

const DEFAULT_PORT = 51234;
const MAX_PORT = 51240;

// Quiet mode: no logs in coprocess mode to avoid iTerm error indicators
let quietMode = false;

// Use stderr for info messages (stdout goes to terminal input in coprocess mode)
const log = (...args: unknown[]) => {
    if (!quietMode) {
        console.error(...args);
    }
};

function formatTime(): string {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    const secs = String(now.getSeconds()).padStart(2, '0');
    return `${hours}:${mins}:${secs}`;
}

/**
 * Generate a unique session ID from the current tty
 */
function getSessionId(): string {
    try {
        const tty = execSync('tty', { encoding: 'utf-8' }).trim();
        return tty;
    } catch {
        // Fallback to random ID if tty not available
        return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }
}

/**
 * Register a session with the server
 */
async function registerSession(port: number, sessionId: string, cwd: string): Promise<boolean> {
    return new Promise((resolve) => {
        const data = JSON.stringify({ session_id: sessionId, cwd });

        const req = http.request({
            hostname: '127.0.0.1',
            port,
            path: '/api/session/register',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
            },
            timeout: 5000,
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                resolve(res.statusCode === 200);
            });
        });

        req.on('error', () => resolve(false));
        req.on('timeout', () => {
            req.destroy();
            resolve(false);
        });

        req.write(data);
        req.end();
    });
}

export async function runFlip(args: string[]): Promise<void> {
    // Enable quiet mode when running as coprocess (stdin is not a TTY)
    // This prevents iTerm from showing error indicators for info messages
    if (!process.stdin.isTTY) {
        quietMode = true;
    }

    // Parse --session flag from anywhere in args
    let sessionId: string | undefined;
    const sessionIdx = args.indexOf('--session');
    if (sessionIdx !== -1 && args[sessionIdx + 1]) {
        sessionId = args[sessionIdx + 1];
    }

    // Filter out --session and its value for further parsing
    const filteredArgs = args.filter((arg, idx) => {
        if (arg === '--session') return false;
        if (idx > 0 && args[idx - 1] === '--session') return false;
        return true;
    });

    // Parse subcommand
    let command: string;
    let pathArg: string | undefined;

    if (filteredArgs.length > 0) {
        switch (filteredArgs[0]) {
            case 'serve':
                command = 'serve';
                pathArg = filteredArgs[1];
                break;
            case 'open':
                command = 'open';
                break;
            case 'setup':
                command = 'setup';
                break;
            case '--help':
            case '-h':
                printUsage();
                return;
            default:
                command = 'oneshot';
                pathArg = filteredArgs[0];
                break;
        }
    } else {
        command = 'oneshot';
    }

    const cwd = pathArg ? path.resolve(pathArg) : process.cwd();

    // Get or generate session ID
    const finalSessionId = sessionId || getSessionId();

    switch (command) {
        case 'setup': {
            await setupHotkey();
            return;
        }

        case 'serve': {
            // Daemon mode: start or reuse server, keep running
            let port = await findExistingServer(DEFAULT_PORT, MAX_PORT);

            if (port) {
                log(`[${formatTime()}] Found existing server at port ${port}`);
            } else {
                port = await findFreePort(DEFAULT_PORT, MAX_PORT);
                log(`[${formatTime()}] Starting new server at port ${port}`);

                // Start server in background (non-blocking)
                const server = new Server(port, { sessionTimeoutMs: 4000 });
                server.run().catch(err => {
                    log(`[${formatTime()}] Server error:`, err);
                });
            }

            log(`[${formatTime()}] Server running at http://localhost:${port}`);
            log('Press Ctrl+C to stop');
            log('');
            log('To open browser, run: csq flip open');
            log(`Or use hotkey to open: open http://localhost:${port}`);

            // Keep the process alive
            await new Promise(() => {});
        }

        case 'open': {
            // Just open browser to existing server
            const port = await findExistingServer(DEFAULT_PORT, MAX_PORT);

            if (!port) {
                log('No csq flip server running.');
                log('Start with: csq flip serve');
                log('Or use: csq flip (one-shot mode)');
                return;
            }

            // Register session
            if (!await registerSession(port, finalSessionId, cwd)) {
                log('Failed to register session with server');
                return;
            }

            const url = `http://localhost:${port}?session=${encodeURIComponent(finalSessionId)}`;
            log(`Opening ${url} in browser...`);

            try {
                await open(url);
            } catch (e) {
                log('Failed to open browser:', e);
                log(`Please open ${url} manually`);
            }
            break;
        }

        case 'oneshot':
        default: {
            // One-shot mode: find or start server, register session, open browser
            let port = await findExistingServer(DEFAULT_PORT, MAX_PORT);
            let serverPromise: Promise<void> | null = null;

            if (!port) {
                port = await findFreePort(DEFAULT_PORT, MAX_PORT);
                log(`Starting server at http://localhost:${port}...`);

                // Start server with idle timeout
                const server = new Server(port, {
                    sessionTimeoutMs: 4000,  // 4s (polling is 2s, so 2 missed polls = dead)
                    idleTimeout: 5000,
                });

                // Run server and save promise
                serverPromise = server.run();

                // Wait a bit for server to start
                await new Promise(resolve => setTimeout(resolve, 100));
            } else {
                log(`Using existing server at http://localhost:${port}`);
            }

            // Register session
            if (!await registerSession(port, finalSessionId, cwd)) {
                log('Failed to register session with server');
                return;
            }

            const url = `http://localhost:${port}?session=${encodeURIComponent(finalSessionId)}`;
            log(`Opening ${url} in browser...`);

            try {
                await open(url);
            } catch (e) {
                log('Failed to open browser:', e);
                log(`Please open ${url} manually`);
            }

            // If we started the server, wait for it to shutdown
            if (serverPromise) {
                log(`Session: ${finalSessionId}`);
                log('Waiting for session to complete... (Ctrl+C to exit)');
                await serverPromise;
                log(`[${formatTime()}] Done`);
            }
            break;
        }
    }
}

function printUsage(): void {
    console.error('Usage: csq flip [command] [options]');
    console.error('');
    console.error('Commands:');
    console.error('  serve [path]    Start server in daemon mode (keeps running)');
    console.error('  open            Open browser to existing server');
    console.error('  setup           Setup hotkey in shell config');
    console.error('  (no command)    Start server + open browser (one-shot mode)');
    console.error('');
    console.error('Options:');
    console.error('  path               Directory to serve (default: current directory)');
    console.error('  --session <id>     Session ID for paste-back tracking (auto-generated from tty)');
}

async function setupHotkey(): Promise<void> {
    let nodePath: string;
    try {
        nodePath = execSync('which node', { encoding: 'utf-8' }).trim();
    } catch {
        nodePath = '/usr/local/bin/node';
    }

    let csqPath: string;
    try {
        csqPath = execSync('which csq', { encoding: 'utf-8' }).trim();
    } catch {
        csqPath = new URL(import.meta.url).pathname;
    }

    // Wrapper script that gets cwd from iTerm2 and passes to csq flip
    const nodeDir = path.dirname(nodePath);
    const wrapperScript = `#!/bin/bash
# Add node to PATH (coprocess doesn't inherit shell PATH)
export PATH="${nodeDir}:$PATH"

# Get current directory from iTerm2
CWD=$(osascript -e 'tell application "iTerm2" to tell current session of current tab of current window to return variable named "session.path"' 2>/dev/null)

# Fallback: try to get from tty
if [ -z "$CWD" ] || [ "$CWD" = "missing value" ]; then
    TTY=$(osascript -e 'tell application "iTerm2" to tell current session of current tab of current window to return tty' 2>/dev/null)
    if [ -n "$TTY" ]; then
        PID=$(lsof -t "$TTY" 2>/dev/null | head -1)
        if [ -n "$PID" ]; then
            CWD=$(lsof -a -d cwd -p "$PID" -Fn 2>/dev/null | grep ^n | cut -c2-)
        fi
    fi
fi

# Run csq flip with cwd
if [ -n "$CWD" ] && [ "$CWD" != "missing value" ]; then
    exec ${csqPath} flip "$CWD"
else
    exec ${csqPath} flip
fi
`;

    // Save wrapper script
    const scriptDir = path.join(os.homedir(), '.config', 'csq');
    const scriptPath = path.join(scriptDir, 'flip-hotkey.sh');

    if (!fs.existsSync(scriptDir)) {
        fs.mkdirSync(scriptDir, { recursive: true });
    }

    fs.writeFileSync(scriptPath, wrapperScript, { mode: 0o755 });

    console.log('');
    console.log('┌─────────────────────────────────────────────────┐');
    console.log('│           Flip Hotkey Setup (iTerm2)            │');
    console.log('└─────────────────────────────────────────────────┘');
    console.log('');
    console.log('1. iTerm2 → Settings → Keys → Key Bindings');
    console.log('2. + 클릭');
    console.log('3. Keyboard Shortcut: ⌘⇧F (Cmd+Shift+F)');
    console.log('4. Action: "Run Coprocess"');
    console.log('5. Command (아래 자동 복사됨):');
    console.log('');
    console.log(`   ${scriptPath}`);
    console.log('');

    try {
        await copyToClipboard(scriptPath);
        console.log('   (Copied to clipboard!)');
    } catch {
        // Ignore clipboard errors
    }

    console.log('');
}
