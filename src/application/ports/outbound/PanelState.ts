import { DiffResult } from '../../../domain/entities/Diff';

/**
 * File information for panel display
 */
export interface FileInfo {
    path: string;
    name: string;
    status: 'modified' | 'added' | 'deleted';
}

/**
 * Comment information for panel display
 */
export interface CommentInfo {
    id: string;
    file: string;
    line: number;
    endLine?: number;
    text: string;
}

/**
 * AI session status
 */
export interface AIStatus {
    active: boolean;
    type?: 'claude' | 'codex' | 'gemini' | string;
}

/**
 * Complete panel state - single source of truth for UI
 */
export interface PanelState {
    files: FileInfo[];
    selectedFile: string | null;
    diff: DiffResult | null;
    comments: CommentInfo[];
    aiStatus: AIStatus;
}

/**
 * Create initial empty state
 */
export function createInitialPanelState(): PanelState {
    return {
        files: [],
        selectedFile: null,
        diff: null,
        comments: [],
        aiStatus: { active: false },
    };
}
