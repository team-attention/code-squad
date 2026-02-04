import type { WorktreeInfo } from '@code-squad/core';

/**
 * 격리 모드 (스레드 타입)
 */
export type IsolationMode = 'local' | 'worktree' | 'window';

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
}

/**
 * 통합 스레드 정보
 */
export interface ThreadInfo {
    id: string;
    name: string;
    type: 'worktree' | 'local';
    path: string;
    branch?: string;
    isolationMode: IsolationMode;
    hasPane: boolean;
    paneId?: string;
}

/**
 * 새 스레드 폼 상태
 */
export interface NewThreadForm {
    name: string;
    isolationMode: IsolationMode;
    branchName: string;
    isExpanded: boolean;
}

/**
 * 입력 모드
 */
export type InputMode = 'normal' | 'new-thread-form' | 'confirm-delete';

/**
 * 대시보드 상태
 */
export interface DashboardState {
    threads: ThreadInfo[];
    panes: PaneInfo[];
    selectedIndex: number;
    repoName: string;
    workspaceRoot: string;
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
 * 대시보드 액션
 */
export type DashAction =
    | { type: 'select'; index: number }
    | { type: 'create'; name: string }
    | { type: 'delete'; index: number }
    | { type: 'split'; direction: 'h' | 'v' }
    | { type: 'focus'; paneIndex: number }
    | { type: 'refresh' };

// Re-export for backward compatibility
export type { WorktreeInfo };
