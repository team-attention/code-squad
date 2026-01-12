import { Router, Request, Response } from 'express';
import type { Router as IRouter } from 'express';
import fs from 'fs';
import path from 'path';
import { isFiltered } from '../constants/filters.js';
import { SessionManager } from '../session/SessionManager.js';

export interface FileNode {
    path: string;
    name: string;
    type: 'file' | 'directory';
    filtered?: boolean;
    children?: FileNode[];
}

export interface FilesResponse {
    root: string;
    tree: FileNode[];
}

export interface FileWithMtime {
    path: string;
    mtime: number;
}

export interface FlatFilesResponse {
    files: FileWithMtime[];
    filteredDirs: string[];
    recentFile: string | null;
}

const router: IRouter = Router();

function buildFileTree(rootPath: string, currentPath: string, maxDepth: number, depth: number = 0): FileNode[] {
    if (depth > maxDepth) return [];

    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    const nodes: FileNode[] = [];

    // Sort: directories first, then alphabetically
    entries.sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
    });

    for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        const relativePath = path.relative(rootPath, fullPath);
        const filtered = isFiltered(entry.name);

        const node: FileNode = {
            path: relativePath,
            name: entry.name,
            type: entry.isDirectory() ? 'directory' : 'file',
            ...(filtered && { filtered: true }),
        };

        // Don't load children for filtered directories (performance)
        if (entry.isDirectory() && !filtered) {
            node.children = buildFileTree(rootPath, fullPath, maxDepth, depth + 1);
        }

        nodes.push(node);
    }

    return nodes;
}

interface CollectResult {
    files: FileWithMtime[];
    filteredDirs: string[];
}

// Memory-efficient: pass result object through recursion to avoid intermediate arrays
function collectFlatFiles(
    rootPath: string,
    currentPath: string,
    maxDepth: number,
    depth: number = 0,
    result: CollectResult = { files: [], filteredDirs: [] }
): CollectResult {
    if (depth > maxDepth) return result;

    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        const relativePath = path.relative(rootPath, fullPath);

        if (isFiltered(entry.name)) {
            if (entry.isDirectory()) {
                result.filteredDirs.push(relativePath);
            }
            continue; // Don't traverse filtered directories
        }

        if (entry.isFile()) {
            try {
                const stat = fs.statSync(fullPath);
                result.files.push({
                    path: relativePath,
                    mtime: stat.mtimeMs,
                });
            } catch {
                // Skip files that can't be stat'd
            }
        } else if (entry.isDirectory()) {
            collectFlatFiles(rootPath, fullPath, maxDepth, depth + 1, result);
        }
    }

    return result;
}

/**
 * Get cwd from session_id query parameter
 */
function getCwdFromSession(req: Request, res: Response): string | null {
    const sessionId = req.query.session_id as string;

    if (!sessionId) {
        res.status(400).json({ error: 'Missing session_id parameter' });
        return null;
    }

    const sessionManager = req.app.locals.sessionManager as SessionManager;
    const session = sessionManager.getSession(sessionId);

    if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return null;
    }

    return session.cwd;
}

// GET /api/files?session_id=xxx - Get file tree structure
router.get('/', (req: Request, res: Response) => {
    const cwd = getCwdFromSession(req, res);
    if (!cwd) return;

    const tree = buildFileTree(cwd, cwd, 10);

    const response: FilesResponse = {
        root: cwd,
        tree,
    };

    res.json(response);
});

// GET /api/files/flat?session_id=xxx - Get flat list of all files with mtime
router.get('/flat', (req: Request, res: Response) => {
    const cwd = getCwdFromSession(req, res);
    if (!cwd) return;

    const result = collectFlatFiles(cwd, cwd, 10);

    // Sort files by path for consistent display
    result.files.sort((a, b) => a.path.localeCompare(b.path));
    result.filteredDirs.sort();

    // Find the most recently modified file
    let recentFile: string | null = null;
    if (result.files.length > 0) {
        const mostRecent = result.files.reduce((prev, curr) =>
            curr.mtime > prev.mtime ? curr : prev
        );
        recentFile = mostRecent.path;
    }

    const response: FlatFilesResponse = {
        files: result.files,
        filteredDirs: result.filteredDirs,
        recentFile,
    };

    res.json(response);
});

export { router as filesRouter };
