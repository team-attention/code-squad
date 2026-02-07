import { exec as execCallback } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import type { IGitPort, WorktreeInfo } from '@code-squad/core';

const exec = promisify(execCallback);
const execOptions = { maxBuffer: 1024 * 1024 };

type PartialGitPort = Pick<
    IGitPort,
    | 'isGitRepository'
    | 'getCurrentBranch'
    | 'listWorktrees'
    | 'createWorktree'
    | 'removeWorktree'
    | 'deleteBranch'
    | 'isValidWorktree'
    | 'getWorktreeBranch'
>;

export class GitAdapter implements PartialGitPort {
    async isGitRepository(workspaceRoot: string): Promise<boolean> {
        try {
            await exec(`cd "${workspaceRoot}" && git rev-parse --git-dir`, execOptions);
            return true;
        } catch {
            return false;
        }
    }

    async getCurrentBranch(workspaceRoot: string): Promise<string> {
        try {
            const { stdout } = await exec(
                `cd "${workspaceRoot}" && git rev-parse --abbrev-ref HEAD`,
                execOptions
            );
            return stdout.trim();
        } catch {
            // No commits yet — fall back to symbolic-ref (e.g. "main" on fresh repos)
            try {
                const { stdout } = await exec(
                    `cd "${workspaceRoot}" && git symbolic-ref --short HEAD`,
                    execOptions
                );
                return stdout.trim();
            } catch {
                return '';
            }
        }
    }

    async listWorktrees(workspaceRoot: string): Promise<WorktreeInfo[]> {
        try {
            const { stdout } = await exec(
                `cd "${workspaceRoot}" && git worktree list --porcelain`,
                execOptions
            );

            const worktrees: WorktreeInfo[] = [];
            const lines = stdout.split('\n').filter((line) => line.trim());

            // Parse porcelain format: groups of 3 lines
            // worktree /path
            // HEAD sha
            // branch refs/heads/name
            let i = 0;
            while (i < lines.length) {
                const worktreeLine = lines[i];
                const headLine = lines[i + 1];
                const branchLine = lines[i + 2];

                if (!worktreeLine || !headLine) {
                    i++;
                    continue;
                }

                const pathMatch = worktreeLine.match(/^worktree (.+)$/);
                const headMatch = headLine.match(/^HEAD (.+)$/);
                const branchMatch = branchLine?.match(/^branch refs\/heads\/(.+)$/);

                if (pathMatch && headMatch) {
                    const path = pathMatch[1];
                    const head = headMatch[1];
                    const branch = branchMatch ? branchMatch[1] : 'HEAD';

                    // Skip main repository root (first entry)
                    if (path !== workspaceRoot) {
                        worktrees.push({ path, branch, head });
                    }
                }

                // Move to next worktree entry
                i += 3;
            }

            return worktrees;
        } catch {
            return [];
        }
    }

    async createWorktree(
        worktreePath: string,
        branch: string,
        workspaceRoot: string
    ): Promise<void> {
        // Prune stale worktree entries (e.g. directory was deleted but still registered)
        await exec(`cd "${workspaceRoot}" && git worktree prune`, execOptions).catch(() => {});

        // Recursively create parent directory
        const parentDir = worktreePath.substring(0, worktreePath.lastIndexOf('/'));
        const mkdirCmd = parentDir ? `mkdir -p "${parentDir}" && ` : '';

        await exec(
            `cd "${workspaceRoot}" && ${mkdirCmd}git worktree add -f "${worktreePath}" -b "${branch}"`,
            execOptions
        );
    }

    async removeWorktree(
        worktreePath: string,
        workspaceRoot: string,
        force = false
    ): Promise<void> {
        const forceFlag = force ? ' --force' : '';
        try {
            await exec(
                `cd "${workspaceRoot}" && git worktree remove "${worktreePath}"${forceFlag}`,
                execOptions
            );
        } catch (error) {
            throw new Error(`Failed to remove worktree: ${(error as Error).message}`);
        }
    }

    async deleteBranch(
        branchName: string,
        workspaceRoot: string,
        force = false
    ): Promise<void> {
        const deleteFlag = force ? '-D' : '-d';
        try {
            await exec(
                `cd "${workspaceRoot}" && git branch ${deleteFlag} "${branchName}"`,
                execOptions
            );
        } catch (error) {
            throw new Error(`Failed to delete branch: ${(error as Error).message}`);
        }
    }

    async isValidWorktree(path: string, workspaceRoot: string): Promise<boolean> {
        // Step 1: Check if path exists and is accessible
        try {
            await fs.promises.access(path, fs.constants.R_OK);
        } catch {
            return false;
        }

        // Step 2: Check if path is a valid git repository
        try {
            await exec(`cd "${path}" && git rev-parse --git-dir`, execOptions);
        } catch {
            return false;
        }

        // Step 3: Verify path is listed in main repo's worktree list
        const worktrees = await this.listWorktrees(workspaceRoot);
        return worktrees.some((wt) => wt.path === path);
    }

    async getWorktreeBranch(worktreePath: string): Promise<string> {
        try {
            const { stdout } = await exec(
                `cd "${worktreePath}" && git rev-parse --abbrev-ref HEAD`,
                execOptions
            );
            return stdout.trim();
        } catch (error) {
            throw new Error(`Failed to get branch name: ${(error as Error).message}`);
        }
    }

    /**
     * 현재 디렉토리가 워크트리인지 확인하고 컨텍스트 반환
     */
    async getWorktreeContext(cwd: string): Promise<{
        isWorktree: boolean;
        mainRoot: string | null;
        currentPath: string;
        branch: string | null;
    }> {
        // git-common-dir로 워크트리 여부 확인
        let commonDir: string | null = null;
        try {
            const { stdout } = await exec(
                `cd "${cwd}" && git rev-parse --git-common-dir`,
                execOptions
            );
            commonDir = stdout.trim();
        } catch {
            return { isWorktree: false, mainRoot: null, currentPath: cwd, branch: null };
        }

        // .git 이면 메인 레포, 아니면 워크트리
        const isWorktree = commonDir !== '.git';

        if (!isWorktree) {
            return { isWorktree: false, mainRoot: cwd, currentPath: cwd, branch: null };
        }

        // 메인 레포 루트 찾기 (worktree list의 첫 번째)
        let mainRoot: string | null = null;
        try {
            const { stdout } = await exec(
                `cd "${cwd}" && git worktree list --porcelain`,
                execOptions
            );
            const match = stdout.match(/^worktree (.+)$/m);
            mainRoot = match ? match[1] : null;
        } catch {
            // ignore
        }

        // 현재 브랜치
        const branch = await this.getWorktreeBranch(cwd).catch(() => null);

        return { isWorktree, mainRoot, currentPath: cwd, branch };
    }

    /**
     * staged 또는 unstaged 변경사항이 있는지 확인 (untracked 제외)
     */
    async hasDirtyState(workspacePath: string): Promise<boolean> {
        try {
            const { stdout } = await exec(
                `cd "${workspacePath}" && git status --porcelain`,
                execOptions
            );
            // ?? 로 시작하는 줄(untracked)을 제외한 변경사항이 있는지
            const lines = stdout.split('\n').filter(line => line.trim());
            const dirtyLines = lines.filter(line => !line.startsWith('??'));
            return dirtyLines.length > 0;
        } catch {
            // 에러 시 안전하게 dirty로 처리 (데이터 손실 방지)
            return true;
        }
    }
}
