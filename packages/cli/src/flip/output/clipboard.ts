import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Copy text to system clipboard
 */
export async function copyToClipboard(text: string): Promise<void> {
    const tmpFile = path.join(os.tmpdir(), `flip-clipboard-${Date.now()}.txt`);

    const cleanupTmpFile = () => {
        try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
    };

    const spawnWithCleanup = (command: string, args: string[]): void => {
        const child = spawn(command, args, {
            detached: true,
            stdio: 'ignore',
        });
        child.on('error', cleanupTmpFile);
        child.on('exit', cleanupTmpFile);
        child.unref();
    };

    if (process.platform === 'darwin') {
        try {
            fs.writeFileSync(tmpFile, text);
            spawnWithCleanup('sh', ['-c', `cat "${tmpFile}" | pbcopy && rm "${tmpFile}"`]);
        } catch (e) {
            console.log(`Output saved to: ${tmpFile}`);
            throw e;
        }
    } else if (process.platform === 'linux') {
        try {
            fs.writeFileSync(tmpFile, text);
            spawnWithCleanup('sh', ['-c', `(xclip -selection clipboard < "${tmpFile}" || xsel --clipboard --input < "${tmpFile}") && rm "${tmpFile}"`]);
        } catch (e) {
            console.log(`Output saved to: ${tmpFile}`);
            throw e;
        }
    } else if (process.platform === 'win32') {
        try {
            fs.writeFileSync(tmpFile, text);
            spawnWithCleanup('cmd', ['/c', `type "${tmpFile}" | clip && del "${tmpFile}"`]);
        } catch (e) {
            console.log(`Output saved to: ${tmpFile}`);
            throw e;
        }
    }
}
