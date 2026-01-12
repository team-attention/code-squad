import { Router, Request, Response } from 'express';
import type { Router as IRouter } from 'express';
import fs from 'fs';
import path from 'path';
import { SessionManager } from '../session/SessionManager.js';

export interface FileResponse {
    path: string;
    content: string;
    language: string;
}

const router: IRouter = Router();

// Extension to language mapping
const extensionMap: Record<string, string> = {
    // JavaScript/TypeScript
    js: 'javascript',
    mjs: 'javascript',
    cjs: 'javascript',
    ts: 'typescript',
    mts: 'typescript',
    cts: 'typescript',
    tsx: 'tsx',
    jsx: 'jsx',

    // Systems languages
    rs: 'rust',
    go: 'go',
    c: 'c',
    cpp: 'cpp',
    cc: 'cpp',
    cxx: 'cpp',
    h: 'cpp',
    hpp: 'cpp',
    hxx: 'cpp',

    // JVM languages
    java: 'java',
    kt: 'kotlin',
    kts: 'kotlin',
    scala: 'scala',
    groovy: 'groovy',

    // Scripting languages
    py: 'python',
    rb: 'ruby',
    php: 'php',
    pl: 'perl',
    lua: 'lua',

    // Mobile
    swift: 'swift',
    m: 'objective-c',
    mm: 'objective-cpp',
    dart: 'dart',

    // Web
    html: 'html',
    htm: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    less: 'less',
    vue: 'vue',
    svelte: 'svelte',
    astro: 'astro',

    // Data formats
    json: 'json',
    jsonc: 'jsonc',
    yaml: 'yaml',
    yml: 'yaml',
    toml: 'toml',
    xml: 'xml',
    csv: 'csv',

    // Documentation
    md: 'markdown',
    mdx: 'mdx',
    rst: 'rst',
    tex: 'latex',

    // Shell
    sh: 'bash',
    bash: 'bash',
    zsh: 'bash',
    fish: 'fish',
    ps1: 'powershell',
    bat: 'batch',
    cmd: 'batch',

    // Database
    sql: 'sql',
    prisma: 'prisma',
    graphql: 'graphql',
    gql: 'graphql',

    // Config
    ini: 'ini',
    conf: 'ini',
    cfg: 'ini',
    env: 'dotenv',

    // Other
    dockerfile: 'dockerfile',
    makefile: 'makefile',
    cmake: 'cmake',
    diff: 'diff',
    patch: 'diff',
};

// Filename to language mapping (for files without extensions)
const filenameMap: Record<string, string> = {
    'Makefile': 'makefile',
    'makefile': 'makefile',
    'GNUmakefile': 'makefile',
    'Dockerfile': 'dockerfile',
    'dockerfile': 'dockerfile',
    'Containerfile': 'dockerfile',
    'Jenkinsfile': 'groovy',
    'Vagrantfile': 'ruby',
    'Gemfile': 'ruby',
    'Rakefile': 'ruby',
    'Brewfile': 'ruby',
    'Podfile': 'ruby',
    'Fastfile': 'ruby',
    'Guardfile': 'ruby',
    '.gitignore': 'gitignore',
    '.gitattributes': 'gitattributes',
    '.editorconfig': 'editorconfig',
    '.bashrc': 'bash',
    '.zshrc': 'bash',
    '.bash_profile': 'bash',
    '.profile': 'bash',
    'CMakeLists.txt': 'cmake',
    'CODEOWNERS': 'gitignore',
};

function detectLanguage(filePath: string): string {
    const basename = path.basename(filePath);

    // Check filename first (for files like Makefile, Dockerfile)
    if (filenameMap[basename]) {
        return filenameMap[basename];
    }

    // Then check extension
    const ext = path.extname(filePath).slice(1).toLowerCase();
    if (extensionMap[ext]) {
        return extensionMap[ext];
    }

    return 'text';
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

// GET /api/file?session_id=xxx&path=<path>
router.get('/', (req: Request, res: Response) => {
    const cwd = getCwdFromSession(req, res);
    if (!cwd) return;

    const relativePath = req.query.path as string;

    if (!relativePath) {
        res.status(400).json({ error: 'Missing path parameter' });
        return;
    }

    const filePath = path.join(cwd, relativePath);

    // Security check: ensure path is within cwd
    const resolvedPath = path.resolve(filePath);
    const resolvedCwd = path.resolve(cwd);

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
