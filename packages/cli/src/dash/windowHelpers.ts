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
            let projectRoot: string | undefined;

            if (isGitRepo) {
                try {
                    const context = await gitAdapter.getWorktreeContext(w.cwd);
                    worktreeBranch = context.branch ?? undefined;
                    projectRoot = context.mainRoot ?? undefined;
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
                projectRoot,
            };
        })
    );

    return windowsWithGitInfo;
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
