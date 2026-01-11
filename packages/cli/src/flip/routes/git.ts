import { Router, Request, Response } from 'express';
import type { Router as IRouter } from 'express';
import { execSync } from 'child_process';
import { AppState } from '../server/Server.js';

export interface UnstagedFile {
    path: string;
    status: string;
}

export interface GitStatusResponse {
    isGitRepo: boolean;
    unstaged: UnstagedFile[];
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

export { router as gitRouter };
