import { Router, Request, Response } from 'express';
import type { Router as IRouter } from 'express';
import fs from 'fs';
import path from 'path';
import { AppState } from '../server/Server.js';

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

// Patterns to filter for performance
// These are system directories that users don't directly edit
const FILTERED_PATTERNS = [
    // Package managers
    'node_modules',
    'vendor',
    '.pnpm-store',
    // VCS internal
    '.git',
    '.svn',
    '.hg',
    // OS metadata
    '.DS_Store',
    'Thumbs.db',
    // Build output
    'dist',
    'build',
    'out',
];

function isFiltered(name: string): boolean {
    return FILTERED_PATTERNS.includes(name);
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

function collectFlatFiles(rootPath: string, currentPath: string, maxDepth: number, depth: number = 0): CollectResult {
    if (depth > maxDepth) return { files: [], filteredDirs: [] };

    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    const files: string[] = [];
    const filteredDirs: string[] = [];

    for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        const relativePath = path.relative(rootPath, fullPath);

        if (isFiltered(entry.name)) {
            if (entry.isDirectory()) {
                filteredDirs.push(relativePath);
            }
            continue; // Don't traverse filtered directories
        }

        if (entry.isFile()) {
            files.push(relativePath);
        } else if (entry.isDirectory()) {
            const subResult = collectFlatFiles(rootPath, fullPath, maxDepth, depth + 1);
            files.push(...subResult.files);
            filteredDirs.push(...subResult.filteredDirs);
        }
    }

    return { files, filteredDirs };
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
