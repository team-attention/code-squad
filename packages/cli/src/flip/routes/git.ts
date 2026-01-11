import { Router, Request, Response } from 'express';
import type { Router as IRouter } from 'express';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { AppState } from '../server/Server.js';

export interface UnstagedFile {
    path: string;
    status: string;
}

export interface GitStatusResponse {
    isGitRepo: boolean;
    unstaged: UnstagedFile[];
}

export interface DiffLine {
    type: 'context' | 'add' | 'delete';
    content: string;
    oldLineNumber?: number;
    newLineNumber?: number;
}

export interface DiffHunk {
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
    lines: DiffLine[];
}

export interface FileDiff {
    hunks: DiffHunk[];
    status: 'modified' | 'added' | 'deleted' | 'untracked';
}

const router: IRouter = Router();

function parseGitStatus(output: string): UnstagedFile[] {
    const files: UnstagedFile[] = [];

    for (const line of output.split('\n')) {
        if (line.length < 3) continue;

        const statusCode = line.substring(0, 2);
        let filePath = line.substring(3);

        // Remove quotes if present (git uses quotes for paths with special chars)
        filePath = filePath.replace(/^"|"$/g, '');

        let status: string;
        if (statusCode === '??') {
            status = 'untracked';
        } else if (statusCode.includes('M')) {
            status = 'modified';
        } else if (statusCode.includes('D')) {
            status = 'deleted';
        } else if (statusCode.includes('A')) {
            status = 'added';
        } else if (statusCode.includes('R')) {
            status = 'renamed';
        } else if (statusCode.includes('C')) {
            status = 'copied';
        } else if (statusCode === 'UU') {
            status = 'unmerged';
        } else {
            status = 'modified';
        }

        files.push({ path: filePath, status });
    }

    return files;
}

function parseUnifiedDiff(diffOutput: string): DiffHunk[] {
    const hunks: DiffHunk[] = [];
    const lines = diffOutput.split('\n');

    let currentHunk: DiffHunk | null = null;
    let oldLineNum = 0;
    let newLineNum = 0;

    for (const line of lines) {
        // Parse hunk header: @@ -oldStart,oldLines +newStart,newLines @@
        const hunkMatch = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
        if (hunkMatch) {
            if (currentHunk) {
                hunks.push(currentHunk);
            }
            currentHunk = {
                oldStart: parseInt(hunkMatch[1], 10),
                oldLines: parseInt(hunkMatch[2] || '1', 10),
                newStart: parseInt(hunkMatch[3], 10),
                newLines: parseInt(hunkMatch[4] || '1', 10),
                lines: [],
            };
            oldLineNum = currentHunk.oldStart;
            newLineNum = currentHunk.newStart;
            continue;
        }

        if (!currentHunk) continue;

        // Skip diff metadata lines
        if (line.startsWith('diff ') || line.startsWith('index ') ||
            line.startsWith('--- ') || line.startsWith('+++ ') ||
            line.startsWith('\\')) {
            continue;
        }

        if (line.startsWith('+')) {
            currentHunk.lines.push({
                type: 'add',
                content: line.substring(1),
                newLineNumber: newLineNum++,
            });
        } else if (line.startsWith('-')) {
            currentHunk.lines.push({
                type: 'delete',
                content: line.substring(1),
                oldLineNumber: oldLineNum++,
            });
        } else if (line.startsWith(' ') || line === '') {
            currentHunk.lines.push({
                type: 'context',
                content: line.startsWith(' ') ? line.substring(1) : line,
                oldLineNumber: oldLineNum++,
                newLineNumber: newLineNum++,
            });
        }
    }

    if (currentHunk) {
        hunks.push(currentHunk);
    }

    return hunks;
}

function createAddedFileDiff(content: string): DiffHunk[] {
    const lines = content.split('\n');
    const diffLines: DiffLine[] = lines.map((line, idx) => ({
        type: 'add' as const,
        content: line,
        newLineNumber: idx + 1,
    }));

    return [{
        oldStart: 0,
        oldLines: 0,
        newStart: 1,
        newLines: lines.length,
        lines: diffLines,
    }];
}

// GET /api/git/status
router.get('/status', (req: Request, res: Response) => {
    const state = req.app.locals.state as AppState;

    // Check if it's a git repository
    let isGitRepo = false;
    try {
        execSync('git rev-parse --git-dir', {
            cwd: state.cwd,
            stdio: 'pipe',
        });
        isGitRepo = true;
    } catch {
        // Not a git repo
    }

    if (!isGitRepo) {
        const response: GitStatusResponse = {
            isGitRepo: false,
            unstaged: [],
        };
        res.json(response);
        return;
    }

    // Get status using porcelain format
    let unstaged: UnstagedFile[] = [];
    try {
        const output = execSync('git status --porcelain', {
            cwd: state.cwd,
            encoding: 'utf-8',
        });
        unstaged = parseGitStatus(output);
    } catch {
        // Error getting status
    }

    const response: GitStatusResponse = {
        isGitRepo: true,
        unstaged,
    };

    res.json(response);
});

// GET /api/git/diff?path=<file>
router.get('/diff', (req: Request, res: Response) => {
    const state = req.app.locals.state as AppState;
    const relativePath = req.query.path as string;

    if (!relativePath) {
        res.status(400).json({ error: 'Missing path parameter' });
        return;
    }

    const fullPath = path.join(state.cwd, relativePath);

    // Check git status for this file
    let fileStatus: 'modified' | 'added' | 'deleted' | 'untracked' = 'modified';
    try {
        const statusOutput = execSync(`git status --porcelain -- "${relativePath}"`, {
            cwd: state.cwd,
            encoding: 'utf-8',
        });

        if (statusOutput.startsWith('??')) {
            fileStatus = 'untracked';
        } else if (statusOutput.includes('A')) {
            fileStatus = 'added';
        } else if (statusOutput.includes('D')) {
            fileStatus = 'deleted';
        }
    } catch {
        // Not tracked or error
    }

    // For untracked files, show entire content as added
    if (fileStatus === 'untracked') {
        try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const diff: FileDiff = {
                hunks: createAddedFileDiff(content),
                status: 'untracked',
            };
            res.json(diff);
            return;
        } catch {
            res.status(404).json({ error: 'File not found' });
            return;
        }
    }

    // Get diff for tracked file
    try {
        const diffOutput = execSync(`git diff --no-color -- "${relativePath}"`, {
            cwd: state.cwd,
            encoding: 'utf-8',
        });

        if (!diffOutput.trim()) {
            // No changes (file might be staged or unchanged)
            const diff: FileDiff = {
                hunks: [],
                status: fileStatus,
            };
            res.json(diff);
            return;
        }

        const hunks = parseUnifiedDiff(diffOutput);
        const diff: FileDiff = {
            hunks,
            status: fileStatus,
        };

        res.json(diff);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get diff' });
    }
});

export { router as gitRouter };
