import type { WorktreeInfo } from '@code-squad/core';

/**
 * tmux window 정보
 */
export interface TmuxWindowInfo {
    windowId: string;
    windowIndex: number;
    name: string;
    cwd: string;
    isActive: boolean;
    isGitRepo?: boolean;
    worktreeBranch?: string;
    projectRoot?: string;
}

/**
 * 스레드 정보
 */
export interface ThreadInfo {
    id: string;
    name: string;
    path: string;
    branch?: string;
}

/**
 * tmux pane 정보
 */
export interface PaneInfo {
    id: string;
    index: number;
    worktreePath: string;
    worktreeName: string;
    active: boolean;
}

/**
 * 경로 유효성 검사 상태
 */
export type PathStatus = 'valid' | 'creatable' | 'invalid';

export interface PathValidation {
    status: PathStatus;
    isGitRepo: boolean;
}

// Re-export for backward compatibility
export type { WorktreeInfo };
