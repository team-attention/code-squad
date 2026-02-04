import type { TmuxWindowInfo } from './types.js';
import type { TmuxAdapter } from './TmuxAdapter.js';
import { GitAdapter } from '../adapters/GitAdapter.js';

const gitAdapter = new GitAdapter();

/**
 * 현재 세션의 모든 window 목록 조회 (대시보드 제외)
 */
export async function loadAllWindows(
    tmuxAdapter: TmuxAdapter,
    dashWindowIndex: number
): Promise<TmuxWindowInfo[]> {
    const rawWindows = await tmuxAdapter.listWindows();

    // 대시보드 window 제외
    const filteredWindows = rawWindows.filter(w => w.index !== dashWindowIndex);

    // Git 정보 추가
    const windowsWithGitInfo = await Promise.all(
        filteredWindows.map(async (w) => {
            const isGitRepo = await gitAdapter.isGitRepository(w.cwd);
            let worktreeBranch: string | undefined;

            if (isGitRepo) {
                try {
                    const context = await gitAdapter.getWorktreeContext(w.cwd);
                    worktreeBranch = context.branch ?? undefined;
                } catch {
                    // ignore
                }
            }

            return {
                windowId: w.id,
                windowIndex: w.index,
                name: w.name,
                cwd: w.cwd,
                isActive: w.active,
                isGitRepo,
                worktreeBranch,
            };
        })
    );

    return windowsWithGitInfo;
}

/**
 * 특정 경로 기준으로 window 필터링
 * - cwd가 basePath로 시작하거나
 * - basePath가 cwd로 시작하는 경우 (부모/자식 관계)
 */
export function filterWindowsByPath(
    windows: TmuxWindowInfo[],
    basePath: string
): TmuxWindowInfo[] {
    const normalizedBase = basePath.replace(/\/$/, '');

    return windows.filter(w => {
        const normalizedCwd = w.cwd.replace(/\/$/, '');
        return (
            normalizedCwd.startsWith(normalizedBase) ||
            normalizedBase.startsWith(normalizedCwd)
        );
    });
}

/**
 * 새 tmux window 생성
 */
export async function createWindowWithOptions(
    tmuxAdapter: TmuxAdapter,
    cwd: string,
    name?: string
): Promise<string> {
    return tmuxAdapter.createNewWindow(cwd, name);
}

/**
 * window 종료
 */
export async function deleteWindowById(
    tmuxAdapter: TmuxAdapter,
    windowId: string
): Promise<void> {
    await tmuxAdapter.killWindow(windowId);
}
