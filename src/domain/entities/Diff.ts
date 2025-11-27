/**
 * Represents a single line in a diff
 */
export interface DiffLine {
    type: 'addition' | 'deletion' | 'context';
    content: string;
    oldLineNumber?: number;
    newLineNumber?: number;
}

/**
 * Represents a hunk (chunk) of changes in a diff
 */
export interface DiffHunk {
    header: string;
    oldStart: number;
    newStart: number;
    lines: DiffLine[];
}

/**
 * Structured diff result for UI rendering
 */
export interface DiffResult {
    file: string;
    hunks: DiffHunk[];
    stats: {
        additions: number;
        deletions: number;
    };
}
