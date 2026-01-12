// Patterns to filter for performance (O(1) lookup with Set)
// These are system directories that users don't directly edit
export const FILTERED_PATTERNS = new Set([
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
    // Cache directories
    '.cache',
    '.next',
    '.nuxt',
    'coverage',
    '__pycache__',
    '.pytest_cache',
    'target',
    // macOS system folders (prevent FD exhaustion when run from home dir)
    'Library',
    'Applications',
    'Pictures',
    'Movies',
    'Music',
    'Downloads',
    '.Trash',
    '.local',
    '.npm',
    '.nvm',
    '.cargo',
    '.rustup',
    '.volta',
    '.pyenv',
    '.rbenv',
    // Linux system folders
    '.config',
    '.mozilla',
    '.thunderbird',
]);

export function isFiltered(name: string): boolean {
    return FILTERED_PATTERNS.has(name);
}
