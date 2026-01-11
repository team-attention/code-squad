import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Copy text to system clipboard
 */
export async function copyToClipboard(text: string): Promise<void> {
    if (process.platform === 'darwin') {
        // Write to temp file first, then use pbcopy via shell
        const tmpFile = path.join(os.tmpdir(), `flip-clipboard-${Date.now()}.txt`);
        try {
            fs.writeFileSync(tmpFile, text);
            // Use a detached process to avoid EBADF
            const child = spawn('sh', ['-c', `cat "${tmpFile}" | pbcopy && rm "${tmpFile}"`], {
                detached: true,
                stdio: 'ignore',
            });
            child.unref();
        } catch (e) {
            // Fallback: just leave the file for manual copy
            console.log(`Output saved to: ${tmpFile}`);
            throw e;
        }
    } else if (process.platform === 'linux') {
        const tmpFile = path.join(os.tmpdir(), `flip-clipboard-${Date.now()}.txt`);
        fs.writeFileSync(tmpFile, text);
        try {
            const child = spawn('sh', ['-c', `cat "${tmpFile}" | xclip -selection clipboard && rm "${tmpFile}"`], {
                detached: true,
                stdio: 'ignore',
            });
            child.unref();
        } catch {
            try {
                const child = spawn('sh', ['-c', `cat "${tmpFile}" | xsel --clipboard --input && rm "${tmpFile}"`], {
                    detached: true,
                    stdio: 'ignore',
                });
                child.unref();
            } catch (e) {
                // Final fallback if both xclip and xsel fail
                console.log(`Output saved to: ${tmpFile}`);
                throw e;
            }
        }
    } else if (process.platform === 'win32') {
        const tmpFile = path.join(os.tmpdir(), `flip-clipboard-${Date.now()}.txt`);
        fs.writeFileSync(tmpFile, text);
        const child = spawn('cmd', ['/c', `type "${tmpFile}" | clip && del "${tmpFile}"`], {
            detached: true,
            stdio: 'ignore',
        });
        child.unref();
    }
}
