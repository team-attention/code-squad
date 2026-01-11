import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Schedule automatic paste to the original iTerm session
 * @param sessionId The UUID that identifies this flip-view session
 */
export async function schedulePaste(sessionId: string): Promise<void> {
    if (process.platform !== 'darwin') {
        console.error('Auto-paste not supported on this platform. Please paste manually (Ctrl+V).');
        return;
    }

    await pasteToOriginalSession(sessionId);
}

async function pasteToOriginalSession(sessionId: string): Promise<void> {
    // Read the original iTerm session ID from session-specific temp file
    const sessionFile = path.join(os.tmpdir(), `flip-view-session-${sessionId}`);

    let itermSessionId: string | undefined;
    try {
        itermSessionId = fs.readFileSync(sessionFile, 'utf-8').trim();
    } catch {
        // Session file not found
    }

    let script: string;

    if (itermSessionId) {
        // Find the original session by ID and paste to it
        script = `
            tell application "iTerm2"
                set found to false
                repeat with w in windows
                    repeat with t in tabs of w
                        repeat with s in sessions of t
                            if id of s is "${itermSessionId}" then
                                set found to true
                                select s
                                tell s to write text (the clipboard)
                                tell s to write text ""
                                return
                            end if
                        end repeat
                    end repeat
                end repeat

                if not found then
                    display notification "Original session closed. Output copied to clipboard." with title "flip"
                end if
            end tell
        `;

        // Cleanup the session file after use
        try {
            fs.unlinkSync(sessionFile);
        } catch {
            // Ignore cleanup errors
        }
    } else {
        // Fallback: paste to current iTerm session
        script = `
            tell application "iTerm2"
                activate
                delay 0.1
                tell current session of current window
                    write text (the clipboard)
                    write text ""
                end tell
            end tell
        `;
    }

    try {
        execSync(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`, {
            stdio: 'pipe',
        });
    } catch (e) {
        console.error('Failed to paste to iTerm:', e);
    }
}
