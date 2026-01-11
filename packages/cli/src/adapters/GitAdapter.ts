import { exec } from 'child_process';
import * as fs from 'fs';
import type { IGitPort, WorktreeInfo } from '@code-squad/core';

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
        return new Promise((resolve) => {
            exec(
                `cd "${workspaceRoot}" && git rev-parse --git-dir`,
                { maxBuffer: 1024 * 1024 },
                (error) => {
                    resolve(!error);
                }
            );
        });
    }

    async getCurrentBranch(workspaceRoot: string): Promise<string> {
        return new Promise((resolve, reject) => {
            exec(
                `cd "${workspaceRoot}" && git rev-parse --abbrev-ref HEAD`,
                { maxBuffer: 1024 * 1024 },
                (error, stdout) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve(stdout.trim());
                }
            );
        });
    }

    async listWorktrees(workspaceRoot: string): Promise<WorktreeInfo[]> {
        return new Promise((resolve) => {
            exec(
                `cd "${workspaceRoot}" && git worktree list --porcelain`,
                { maxBuffer: 1024 * 1024 },
                (error, stdout) => {
                    if (error) {
                        resolve([]);
                        return;
                    }

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
                        const branchMatch = branchLine?.match(
                            /^branch refs\/heads\/(.+)$/
                        );

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

                    resolve(worktrees);
                }
            );
        });
    }

    async createWorktree(
        worktreePath: string,
        branch: string,
        workspaceRoot: string
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            // Extract parent directory and create it if needed
            const parentDir = worktreePath.substring(
                0,
                worktreePath.lastIndexOf('/')
            );
            const mkdirCmd = parentDir ? `mkdir -p "${parentDir}" && ` : '';

            exec(
                `cd "${workspaceRoot}" && ${mkdirCmd}git worktree add "${worktreePath}" -b "${branch}"`,
                { maxBuffer: 1024 * 1024 },
                (error) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve();
                }
            );
        });
    }

    async removeWorktree(
        worktreePath: string,
        workspaceRoot: string,
        force = false
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const forceFlag = force ? ' --force' : '';
            exec(
                `cd "${workspaceRoot}" && git worktree remove "${worktreePath}"${forceFlag}`,
                { maxBuffer: 1024 * 1024 },
                (error) => {
                    if (error) {
                        reject(
                            new Error(`Failed to remove worktree: ${error.message}`)
                        );
                        return;
                    }
                    resolve();
                }
            );
        });
    }

    async deleteBranch(
        branchName: string,
        workspaceRoot: string,
        force = false
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const deleteFlag = force ? '-D' : '-d';
            exec(
                `cd "${workspaceRoot}" && git branch ${deleteFlag} "${branchName}"`,
                { maxBuffer: 1024 * 1024 },
                (error) => {
                    if (error) {
                        reject(
                            new Error(`Failed to delete branch: ${error.message}`)
                        );
                        return;
                    }
                    resolve();
                }
            );
        });
    }

    async isValidWorktree(path: string, workspaceRoot: string): Promise<boolean> {
        // Step 1: Check if path exists and is accessible
        try {
            await fs.promises.access(path, fs.constants.R_OK);
        } catch {
            return false;
        }

        // Step 2: Check if path is a valid git repository
        const isGitRepo = await new Promise<boolean>((resolve) => {
            exec(
                `cd "${path}" && git rev-parse --git-dir`,
                { maxBuffer: 1024 * 1024 },
                (error) => {
                    resolve(!error);
                }
            );
        });

        if (!isGitRepo) {
            return false;
        }

        // Step 3: Verify path is listed in main repo's worktree list
        const worktrees = await this.listWorktrees(workspaceRoot);
        return worktrees.some((wt) => wt.path === path);
    }

    async getWorktreeBranch(worktreePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            exec(
                `cd "${worktreePath}" && git rev-parse --abbrev-ref HEAD`,
                { maxBuffer: 1024 * 1024 },
                (error, stdout) => {
                    if (error) {
                        reject(
                            new Error(`Failed to get branch name: ${error.message}`)
                        );
                        return;
                    }
                    const branch = stdout.trim();
                    resolve(branch);
                }
            );
        });
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
        const commonDir = await new Promise<string | null>((resolve) => {
            exec(
                `cd "${cwd}" && git rev-parse --git-common-dir`,
                { maxBuffer: 1024 * 1024 },
                (error, stdout) => {
                    if (error) {
                        resolve(null);
                        return;
                    }
                    resolve(stdout.trim());
                }
            );
        });

        if (!commonDir) {
            return { isWorktree: false, mainRoot: null, currentPath: cwd, branch: null };
        }

        // .git 이면 메인 레포, 아니면 워크트리
        const isWorktree = commonDir !== '.git';

        if (!isWorktree) {
            return { isWorktree: false, mainRoot: cwd, currentPath: cwd, branch: null };
        }

        // 메인 레포 루트 찾기 (worktree list의 첫 번째)
        const mainRoot = await new Promise<string | null>((resolve) => {
            exec(
                `cd "${cwd}" && git worktree list --porcelain`,
                { maxBuffer: 1024 * 1024 },
                (error, stdout) => {
                    if (error) {
                        resolve(null);
                        return;
                    }
                    const match = stdout.match(/^worktree (.+)$/m);
                    resolve(match ? match[1] : null);
                }
            );
        });

        // 현재 브랜치
        const branch = await this.getWorktreeBranch(cwd).catch(() => null);

        return { isWorktree, mainRoot, currentPath: cwd, branch };
    }

    /**
     * staged 또는 unstaged 변경사항이 있는지 확인 (untracked 제외)
     */
    async hasDirtyState(workspacePath: string): Promise<boolean> {
        return new Promise((resolve) => {
            exec(
                `cd "${workspacePath}" && git status --porcelain`,
                { maxBuffer: 1024 * 1024 },
                (error, stdout) => {
                    if (error) {
                        // 에러 시 안전하게 dirty로 처리 (데이터 손실 방지)
                        resolve(true);
                        return;
                    }
                    // ?? 로 시작하는 줄(untracked)을 제외한 변경사항이 있는지
                    const lines = stdout.split('\n').filter(line => line.trim());
                    const dirtyLines = lines.filter(line => !line.startsWith('??'));
                    resolve(dirtyLines.length > 0);
                }
            );
        });
    }
}
