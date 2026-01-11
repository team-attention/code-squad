import { Router, Request, Response } from 'express';
import type { Router as IRouter } from 'express';
import fs from 'fs';
import path from 'path';
import { AppState } from '../server/Server.js';

export interface FileResponse {
    path: string;
    content: string;
    language: string;
}

const router: IRouter = Router();

function detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).slice(1).toLowerCase();

    const languageMap: Record<string, string> = {
        rs: 'rust',
        js: 'javascript',
        ts: 'typescript',
        tsx: 'tsx',
        jsx: 'jsx',
        py: 'python',
        go: 'go',
        java: 'java',
        c: 'c',
        cpp: 'cpp',
        cc: 'cpp',
        cxx: 'cpp',
        h: 'cpp',
        hpp: 'cpp',
        md: 'markdown',
        json: 'json',
        yaml: 'yaml',
        yml: 'yaml',
        toml: 'toml',
        html: 'html',
        css: 'css',
        scss: 'scss',
        sh: 'bash',
        bash: 'bash',
        sql: 'sql',
        rb: 'ruby',
        swift: 'swift',
        kt: 'kotlin',
        kts: 'kotlin',
        xml: 'xml',
        vue: 'vue',
    };

    return languageMap[ext] || 'plaintext';
}

// GET /api/file?path=<path>
router.get('/', (req: Request, res: Response) => {
    const state = req.app.locals.state as AppState;
    const relativePath = req.query.path as string;

    if (!relativePath) {
        res.status(400).json({ error: 'Missing path parameter' });
        return;
    }

    const filePath = path.join(state.cwd, relativePath);

    // Security check: ensure path is within cwd
    const resolvedPath = path.resolve(filePath);
    const resolvedCwd = path.resolve(state.cwd);

    if (!resolvedPath.startsWith(resolvedCwd)) {
        res.status(403).json({ error: 'Access denied' });
        return;
    }

    try {
        const content = fs.readFileSync(resolvedPath, 'utf-8');
        const language = detectLanguage(relativePath);

        const response: FileResponse = {
            path: relativePath,
            content,
            language,
        };

        res.json(response);
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
            res.status(404).json({ error: 'File not found' });
        } else {
            res.status(500).json({ error: 'Failed to read file' });
        }
    }
});

export { router as fileRouter };
