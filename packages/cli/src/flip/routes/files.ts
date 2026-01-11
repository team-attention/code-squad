import { Router, Request, Response } from 'express';
import type { Router as IRouter } from 'express';
import fs from 'fs';
import path from 'path';
import { AppState } from '../server/Server.js';

export interface FileNode {
    path: string;
    name: string;
    type: 'file' | 'directory';
    children?: FileNode[];
}

export interface FilesResponse {
    root: string;
    tree: FileNode[];
}

export interface FlatFilesResponse {
    files: string[];
}

const router: IRouter = Router();

// Default ignore patterns (similar to .gitignore behavior)
const DEFAULT_IGNORES = [
    'node_modules',
    '.git',
    '.svn',
    '.hg',
    'dist',
    'build',
    'out',
    '.cache',
    '.next',
    '.nuxt',
    'coverage',
    '__pycache__',
    '.pytest_cache',
    'target',
    'Cargo.lock',
    'package-lock.json',
    'pnpm-lock.yaml',
    'yarn.lock',
    '.DS_Store',
];

function shouldIgnore(name: string): boolean {
    if (name.startsWith('.') && name !== '.gitignore' && name !== '.env.example') {
        return true;
    }
    return DEFAULT_IGNORES.includes(name);
}

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
        if (shouldIgnore(entry.name)) continue;

        const fullPath = path.join(currentPath, entry.name);
        const relativePath = path.relative(rootPath, fullPath);

        const node: FileNode = {
            path: relativePath,
            name: entry.name,
            type: entry.isDirectory() ? 'directory' : 'file',
        };

        if (entry.isDirectory()) {
            node.children = buildFileTree(rootPath, fullPath, maxDepth, depth + 1);
        }

        nodes.push(node);
    }

    return nodes;
}

function collectFlatFiles(rootPath: string, currentPath: string, maxDepth: number, depth: number = 0): string[] {
    if (depth > maxDepth) return [];

    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
        if (shouldIgnore(entry.name)) continue;

        const fullPath = path.join(currentPath, entry.name);
        const relativePath = path.relative(rootPath, fullPath);

        if (entry.isFile()) {
            files.push(relativePath);
        } else if (entry.isDirectory()) {
            files.push(...collectFlatFiles(rootPath, fullPath, maxDepth, depth + 1));
        }
    }

    return files;
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
    const files = collectFlatFiles(state.cwd, state.cwd, 10);
    files.sort();

    const response: FlatFilesResponse = {
        files,
    };

    res.json(response);
});

export { router as filesRouter };
