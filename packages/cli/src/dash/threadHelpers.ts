import * as path from 'path';
import type { ThreadInfo } from './types.js';
import { GitAdapter } from '../adapters/GitAdapter.js';
import { loadConfig, getWorktreeCopyPatterns } from '../config.js';
import { copyFilesWithPatterns } from '../fileUtils.js';

const gitAdapter = new GitAdapter();

/**
 * worktree 스레드 생성
 */
export async function createThread(
    workspaceRoot: string,
    name: string,
    rootOverride?: string
): Promise<ThreadInfo> {
    const baseRoot = rootOverride || workspaceRoot;
    const repoName = path.basename(baseRoot);
    const defaultBasePath = path.join(
        path.dirname(baseRoot),
        `${repoName}.worktree`
    );
    const worktreePath = path.join(defaultBasePath, name);

    // Git worktree 생성
    await gitAdapter.createWorktree(worktreePath, name, baseRoot);

    // 파일 복사
    const configData = await loadConfig(baseRoot);
    const patterns = getWorktreeCopyPatterns(configData);
    if (patterns.length > 0) {
        await copyFilesWithPatterns(baseRoot, worktreePath, patterns);
    }

    return {
        id: worktreePath,
        name,
        path: worktreePath,
        branch: name,
    };
}

/**
 * worktree 스레드 삭제
 */
export async function deleteThread(
    workspaceRoot: string,
    thread: ThreadInfo
): Promise<void> {
    await gitAdapter.removeWorktree(thread.path, workspaceRoot, true);
    if (thread.branch) {
        await gitAdapter.deleteBranch(thread.branch, workspaceRoot, true);
    }
}
