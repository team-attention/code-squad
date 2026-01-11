import { Router, Request, Response } from 'express';
import type { Router as IRouter } from 'express';
import fs from 'fs';
import path from 'path';
import { AppState } from '../server/Server.js';
import { isFiltered } from '../constants/filters.js';

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

export interface FlatFilesResponse {
    files: string[];
    filteredDirs: string[];
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
    files: string[];
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
            result.files.push(relativePath);
        } else if (entry.isDirectory()) {
            collectFlatFiles(rootPath, fullPath, maxDepth, depth + 1, result);
        }
    }

    return result;
}

// GET /api/files - Get file tree structure
router.get('/', (req: Request, res: Response) => {
    const state = req.app.locals.state as AppState;
    const tree = buildFileTree(state.cwd, state.cwd, 10);

    const response: FilesResponse = {
        root: state.cwd,
        tree,
    };

    res.json(response);
});

// GET /api/files/flat - Get flat list of all files
router.get('/flat', (req: Request, res: Response) => {
    const state = req.app.locals.state as AppState;
    const result = collectFlatFiles(state.cwd, state.cwd, 10);
    result.files.sort();
    result.filteredDirs.sort();

    const response: FlatFilesResponse = {
        files: result.files,
        filteredDirs: result.filteredDirs,
    };

    res.json(response);
});

export { router as filesRouter };
