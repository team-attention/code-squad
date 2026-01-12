import { Server, findFreePort } from './server/Server.js';
import open from 'open';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { execSync } from 'child_process';
import { copyToClipboard } from './output/clipboard.js';

const DEFAULT_PORT = 51234;

function formatTime(): string {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    const secs = String(now.getSeconds()).padStart(2, '0');
    return `${hours}:${mins}:${secs}`;
}

export async function runFlip(args: string[]): Promise<void> {
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

    switch (command) {
        case 'setup': {
            await setupHotkey();
            return;
        }

        case 'serve': {
            // Daemon mode: start server, keep running
            const port = await findFreePort(DEFAULT_PORT);
            console.log(`Server running at http://localhost:${port}`);
            console.log('Press Ctrl+C to stop');
            console.log('');
            console.log('To open browser, run: csq flip open');
            console.log(`Or use hotkey to open: open http://localhost:${port}`);

            // Run server in loop (restarts after each submit/cancel)
            while (true) {
                const server = new Server(cwd, port);
                const result = await server.run();

                if (result) {
                    console.log(`[${formatTime()}] Submitted ${result.length} characters`);
                } else {
                    console.log(`[${formatTime()}] Cancelled`);
                }
                console.log(`[${formatTime()}] Ready for next session...`);
            }
        }

        case 'open': {
            // Just open browser to existing server
            const url = `http://localhost:${DEFAULT_PORT}`;
            console.log(`Opening ${url} in browser...`);
            try {
                await open(url);
            } catch (e) {
                console.error('Failed to open browser:', e);
                console.error('Is the server running? Start with: csq flip serve');
            }
            break;
        }

        case 'oneshot':
        default: {
            // Original behavior: start server, open browser, exit after submit/cancel
            const port = await findFreePort(DEFAULT_PORT);
            const url = sessionId
                ? `http://localhost:${port}?session=${sessionId}`
                : `http://localhost:${port}`;

            console.log(`Opening ${url} in browser...`);
            try {
                await open(url);
            } catch (e) {
                console.error('Failed to open browser:', e);
                console.log(`Please open ${url} manually`);
            }

            const server = new Server(cwd, port);
            const result = await server.run();

            if (result) {
                console.log(`\nSubmitted ${result.length} characters`);
            } else {
                console.log('\nCancelled');
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
    console.error('  setup           Setup Alt+; hotkey in shell config');
    console.error('  (no command)    Start server + open browser (one-shot mode)');
    console.error('');
    console.error('Options:');
    console.error('  path               Directory to serve (default: current directory)');
    console.error('  --session <uuid>   Session ID for paste-back tracking');
}

async function setupHotkey(): Promise<void> {
    let nodePath: string;
    try {
        nodePath = execSync('which node', { encoding: 'utf-8' }).trim();
    } catch {
        nodePath = '/usr/local/bin/node';
    }
    const csqPath = new URL(import.meta.url).pathname;
    const command = `${nodePath} ${csqPath} flip`;

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
    console.log(`   ${command}`);
    console.log('');

    try {
        await copyToClipboard(command);
        console.log('   (Copied to clipboard!)');
    } catch {
        // Ignore clipboard errors
    }

    console.log('');
}
