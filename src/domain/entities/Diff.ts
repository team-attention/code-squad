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
 * Represents a chunk of changes in a diff
 */
export interface DiffChunk {
    header: string;
    oldStart: number;
    newStart: number;
    lines: DiffLine[];
    stats: {
        additions: number;
        deletions: number;
    };
}

/**
 * Structured diff result for UI rendering
 */
export interface DiffResult {
    file: string;
    chunks: DiffChunk[];
    stats: {
        additions: number;
        deletions: number;
    };
}
