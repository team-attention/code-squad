import { Server, findFreePort } from './server/Server.js';
import open from 'open';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { execSync } from 'child_process';
import { confirm, select } from '@inquirer/prompts';
import clipboardy from 'clipboardy';

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
    console.error('  setup           Setup iTerm2 hotkey');
    console.error('  (no command)    Start server + open browser (one-shot mode)');
    console.error('');
    console.error('Options:');
    console.error('  path               Directory to serve (default: current directory)');
    console.error('  --session <uuid>   Session ID for paste-back tracking');
}

async function setupHotkey(): Promise<void> {
    const configDir = path.join(os.homedir(), '.config', 'flip');
    const applescriptPath = path.join(configDir, 'flip.applescript');
    const shPath = path.join(configDir, 'flip.sh');

    // Get node path
    let nodePath: string;
    try {
        nodePath = execSync('which node', { encoding: 'utf-8' }).trim();
    } catch {
        nodePath = '/usr/local/bin/node';
    }

    // Get csq path - after bundling, all code is in dist/index.js
    // so import.meta.url points directly to the entry point
    const csqPath = new URL(import.meta.url).pathname;

    // Create config directory
    fs.mkdirSync(configDir, { recursive: true });

    // Write AppleScript
    const applescriptContent = `#!/usr/bin/osascript

-- flip hotkey script
-- Generated by: csq flip setup

tell application "iTerm2"
    tell current session of current window
        set originalSessionId to id
        set sessionUUID to do shell script "uuidgen"
        set currentPath to variable named "path"
        do shell script "echo '" & originalSessionId & "' > /tmp/flip-view-session-" & sessionUUID
        do shell script "nohup ${nodePath} ${csqPath} flip --session " & sessionUUID & " " & quoted form of currentPath & " > /tmp/flip.log 2>&1 &"
    end tell
end tell

return ""`;

    fs.writeFileSync(applescriptPath, applescriptContent);
    fs.chmodSync(applescriptPath, '755');

    // Write shell wrapper
    const shContent = `#!/bin/bash
osascript ${applescriptPath} > /dev/null 2>&1
`;

    fs.writeFileSync(shPath, shContent);
    fs.chmodSync(shPath, '755');

    console.log('');
    console.log('┌─────────────────────────────────────────────────┐');
    console.log('│           Flip Hotkey Setup Wizard              │');
    console.log('└─────────────────────────────────────────────────┘');
    console.log('');
    console.log('✓ Scripts generated:');
    console.log(`  ${shPath}`);
    console.log('');

    // Step 1: Open iTerm2 Settings
    const openSettings = await confirm({
        message: 'Open iTerm2 Settings? (Keys → Key Bindings)',
        default: true,
    });

    if (openSettings) {
        try {
            execSync(`osascript -e 'tell application "iTerm2" to activate' -e 'tell application "System Events" to keystroke "," using command down'`);
            console.log('');
            console.log('  → iTerm2 Settings opened. Navigate to: Keys → Key Bindings');
        } catch {
            console.log('  → Could not open settings automatically. Open manually: iTerm2 → Settings → Keys → Key Bindings');
        }
    }

    console.log('');

    // Step 2: Guide through adding key binding
    const ready = await confirm({
        message: 'Ready to add Key Binding? (Click + button in Key Bindings tab)',
        default: true,
    });

    if (!ready) {
        console.log('');
        console.log('Run `csq flip setup` again when ready.');
        return;
    }

    console.log('');
    console.log('┌─────────────────────────────────────────────────┐');
    console.log('│  Configure the Key Binding:                     │');
    console.log('├─────────────────────────────────────────────────┤');
    console.log('│  1. Keyboard Shortcut: Press your hotkey        │');
    console.log('│     (e.g., ⌘⇧F)                                 │');
    console.log('│                                                 │');
    console.log('│  2. Action: Select "Run Coprocess"              │');
    console.log('│                                                 │');
    console.log('│  3. Command: Paste the path (copied below)      │');
    console.log('└─────────────────────────────────────────────────┘');
    console.log('');

    // Copy path to clipboard
    await clipboardy.write(shPath);
    console.log(`✓ Copied to clipboard: ${shPath}`);
    console.log('');

    await confirm({
        message: 'Done configuring? (Paste the path and click OK)',
        default: true,
    });

    console.log('');
    console.log('┌─────────────────────────────────────────────────┐');
    console.log('│  Setup Complete!                                │');
    console.log('├─────────────────────────────────────────────────┤');
    console.log('│  Usage:                                         │');
    console.log('│  1. Focus on any terminal panel                 │');
    console.log('│  2. Press your hotkey → browser opens           │');
    console.log('│  3. Select files, add comments                  │');
    console.log('│  4. Submit → text appears in terminal           │');
    console.log('└─────────────────────────────────────────────────┘');
    console.log('');
}
