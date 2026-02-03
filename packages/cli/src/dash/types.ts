import type { WorktreeInfo } from '@code-squad/core';

/**
 * 대시보드 상태
 */
export interface DashboardState {
    worktrees: WorktreeInfo[];
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
