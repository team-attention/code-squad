#!/usr/bin/env node

import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as crypto from 'crypto';
import chalk from 'chalk';
import { GitAdapter } from './adapters/GitAdapter.js';
import {
    selectThread,
    selectThreadAction,
    selectNewThreadType,
    newWorktreeForm,
    newLocalForm,
    confirmDeleteWorktree,
    confirmDeleteLocal,
} from './ui/prompts.js';
import type { WorktreeInfo } from '@code-squad/core';
import { runFlip } from './flip/index.js';
import { loadConfig, getWorktreeCopyPatterns } from './config.js';
import { copyFilesWithPatterns } from './fileUtils.js';

// Ctrl+C 시 깔끔하게 종료
process.on('SIGINT', () => {
    process.exit(130);
});

const gitAdapter = new GitAdapter();

// 로컬 스레드 타입
interface LocalThread {
    id: string;
    name: string;
    path: string;
    createdAt: number;
}

// 통합 스레드 타입
interface Thread {
    type: 'worktree' | 'local';
    name: string;
    path: string;
    branch?: string;
}

async function main() {
    const args = process.argv.slice(2);

    // -p 또는 --persistent 플래그 확인
    const persistentMode = args.includes('-p') || args.includes('--persistent');
    const filteredArgs = args.filter(a => a !== '-p' && a !== '--persistent');
    const command = filteredArgs[0];

    // --init: shell function 출력
    if (command === '--init' || command === 'init') {
        printShellInit();
        return;
    }

    // flip 서브커맨드는 git repo 체크 없이 바로 실행
    if (command === 'flip') {
        await runFlip(filteredArgs.slice(1));
        return;
    }

    const workspaceRoot = await findGitRoot(process.cwd());

    if (!workspaceRoot) {
        console.error(chalk.red('Error: Not a git repository'));
        process.exit(1);
    }

    // 서브커맨드 처리
    switch (command) {
        case 'list':
            await listThreads(workspaceRoot);
            break;
        case 'new':
            await createWorktree(workspaceRoot, filteredArgs[1]);
            break;
        default:
            if (persistentMode) {
                await persistentInteractiveMode(workspaceRoot);
            } else {
                await interactiveMode(workspaceRoot);
            }
    }
}

/**
 * Git 루트 찾기 (worktree 안에서도 메인 레포 찾기)
 */
async function findGitRoot(cwd: string): Promise<string | null> {
    if (!(await gitAdapter.isGitRepository(cwd))) {
        return null;
    }

    // worktree인 경우 메인 레포 경로 반환할 수도 있지만,
    // 일단 현재 디렉토리 기준으로
    return cwd;
}

/**
 * Generate a short hash for project identification
 */
function getProjectHash(workspaceRoot: string): string {
    return crypto.createHash('sha256').update(workspaceRoot).digest('hex').slice(0, 8);
}

/**
 * 세션 파일 경로 - stored in global ~/.code-squad directory
 */
function getSessionsPath(workspaceRoot: string): string {
    const projectHash = getProjectHash(workspaceRoot);
    const projectName = path.basename(workspaceRoot);
    return path.join(os.homedir(), '.code-squad', 'sessions', `${projectName}-${projectHash}.json`);
}

/**
 * 로컬 스레드 목록 로드
 */
async function loadLocalThreads(workspaceRoot: string): Promise<LocalThread[]> {
    const sessionsPath = getSessionsPath(workspaceRoot);
    try {
        const content = await fs.promises.readFile(sessionsPath, 'utf-8');
        const data = JSON.parse(content);
        return data.localThreads || [];
    } catch {
        return [];
    }
}

/**
 * 로컬 스레드 저장
 */
async function saveLocalThreads(workspaceRoot: string, threads: LocalThread[]): Promise<void> {
    const sessionsPath = getSessionsPath(workspaceRoot);
    const dir = path.dirname(sessionsPath);

    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(sessionsPath, JSON.stringify({ localThreads: threads }, null, 2));
}

/**
 * 로컬 스레드 추가
 */
async function addLocalThread(workspaceRoot: string, name: string): Promise<LocalThread> {
    const threads = await loadLocalThreads(workspaceRoot);
    const newThread: LocalThread = {
        id: Date.now().toString(),
        name,
        path: workspaceRoot,
        createdAt: Date.now(),
    };
    threads.push(newThread);
    await saveLocalThreads(workspaceRoot, threads);
    return newThread;
}

/**
 * 로컬 스레드 삭제
 */
async function removeLocalThread(workspaceRoot: string, id: string): Promise<void> {
    const threads = await loadLocalThreads(workspaceRoot);
    const filtered = threads.filter(t => t.id !== id);
    await saveLocalThreads(workspaceRoot, filtered);
}

/**
 * 모든 스레드 가져오기 (워크트리 + 로컬)
 */
async function getAllThreads(workspaceRoot: string): Promise<Thread[]> {
    const worktrees = await gitAdapter.listWorktrees(workspaceRoot);
    const localThreads = await loadLocalThreads(workspaceRoot);

    const threads: Thread[] = [
        ...worktrees.map(wt => ({
            type: 'worktree' as const,
            name: wt.branch,
            path: wt.path,
            branch: wt.branch,
        })),
        ...localThreads.map(lt => ({
            type: 'local' as const,
            name: lt.name,
            path: lt.path,
            id: lt.id,
        })),
    ];

    return threads;
}

/**
 * Shell init script 출력
 */
function printShellInit() {
    const script = `
csq() {
  if [[ "\$1" == "--init" ]] || [[ "\$1" == "init" ]]; then
    command csq "\$@"
    return
  fi

  local output
  output=$(command csq "\$@" 2>&1)
  local exit_code=\$?

  if [[ \$exit_code -ne 0 ]]; then
    echo "\$output"
    return \$exit_code
  fi

  # 마지막 줄이 디렉토리면 cd
  local last_line=$(echo "\$output" | tail -1)
  if [[ -d "\$last_line" ]]; then
    # 마지막 줄 제외한 나머지 출력
    echo "\$output" | sed '\$d'
    cd "\$last_line"
  else
    echo "\$output"
  fi
}
`.trim();

    console.log(script);
}

/**
 * 스레드 목록 출력 (non-interactive)
 */
async function listThreads(workspaceRoot: string) {
    const threads = await getAllThreads(workspaceRoot);

    if (threads.length === 0) {
        console.log(chalk.dim('No threads found.'));
        return;
    }

    for (const t of threads) {
        const typeLabel = t.type === 'worktree' ? chalk.cyan('[W]') : chalk.yellow('[L]');
        console.log(`${typeLabel} ${t.name.padEnd(20)} ${chalk.dim(t.path)}`);
    }
}

/**
 * 새 워크트리 생성
 */
async function createWorktree(workspaceRoot: string, name?: string) {
    const repoName = path.basename(workspaceRoot);
    const defaultBasePath = path.join(
        path.dirname(workspaceRoot),
        `${repoName}.worktree`
    );

    let worktreeName: string;
    let worktreePath: string;

    if (name) {
        worktreeName = name;
        worktreePath = path.join(defaultBasePath, name);
    } else {
        const form = await newWorktreeForm(defaultBasePath);
        if (!form) {
            console.log(chalk.dim('Cancelled.'));
            return;
        }
        worktreeName = form.name;
        worktreePath = form.path;
    }

    try {
        await gitAdapter.createWorktree(worktreePath, worktreeName, workspaceRoot);
        console.log(chalk.green(`✓ Created worktree: ${worktreeName}`));

        // 설정 파일에서 복사할 패턴 읽어서 파일 복사
        await copyWorktreeFiles(workspaceRoot, worktreePath);

        await writeCdFile(worktreePath);
    } catch (error) {
        console.error(
            chalk.red(`Failed to create worktree: ${(error as Error).message}`)
        );
        process.exit(1);
    }
}

/**
 * 워크트리에 설정된 패턴의 파일 복사
 * .code-squad.json의 worktreeCopyPatterns 사용
 */
async function copyWorktreeFiles(sourceRoot: string, destRoot: string): Promise<void> {
    const config = await loadConfig(sourceRoot);
    const patterns = getWorktreeCopyPatterns(config);

    if (patterns.length === 0) {
        return;
    }

    const { copied, failed } = await copyFilesWithPatterns(sourceRoot, destRoot, patterns);

    if (copied.length > 0) {
        console.log(chalk.green(`✓ Copied ${copied.length} file(s) to worktree`));
    }

    if (failed.length > 0) {
        console.log(chalk.yellow(`⚠ Failed to copy ${failed.length} file(s)`));
    }
}

/**
 * cd 파일에 경로 쓰기
 */
async function writeCdFile(targetPath: string) {
    const cdFile = process.env.CSQ_CD_FILE;
    if (cdFile) {
        await fs.promises.writeFile(cdFile, targetPath);
    }
}

/**
 * 현재 터미널에 cd 명령어 전송 (AppleScript)
 */
async function cdInCurrentTerminal(targetPath: string): Promise<boolean> {
    const { exec } = await import('child_process');
    const escapedPath = targetPath.replace(/'/g, "'\\''");

    // iTerm2 확인
    const hasIterm = await new Promise<boolean>((resolve) => {
        exec('mdfind "kMDItemCFBundleIdentifier == com.googlecode.iterm2"', (error, stdout) => {
            resolve(!error && stdout.trim().length > 0);
        });
    });

    if (hasIterm) {
        // iTerm2 - 현재 세션에 cd 명령어 전송
        const script = `
tell application "iTerm2"
    tell current session of current window
        write text "cd '${escapedPath}'"
    end tell
end tell`;
        return new Promise((resolve) => {
            exec(`osascript -e '${script}'`, (error) => {
                resolve(!error);
            });
        });
    }

    // Terminal.app
    const terminalScript = `
tell application "Terminal"
    do script "cd '${escapedPath}'" in front window
end tell`;
    return new Promise((resolve) => {
        exec(`osascript -e '${terminalScript}'`, (error) => {
            resolve(!error);
        });
    });
}

/**
 * 새 터미널 split pane 열기
 */
async function openNewTerminal(targetPath: string): Promise<boolean> {
    const { exec } = await import('child_process');
    const escapedPath = targetPath.replace(/'/g, "'\\''");

    // iTerm2 확인
    const hasIterm = await new Promise<boolean>((resolve) => {
        exec('mdfind "kMDItemCFBundleIdentifier == com.googlecode.iterm2"', (error, stdout) => {
            resolve(!error && stdout.trim().length > 0);
        });
    });

    if (hasIterm) {
        // iTerm2 split pane
        const script = `
tell application "iTerm2"
    tell current session of current window
        set newSession to (split vertically with default profile)
        tell newSession
            write text "cd '${escapedPath}'"
        end tell
    end tell
end tell`;
        return new Promise((resolve) => {
            exec(`osascript -e '${script}'`, (error) => {
                resolve(!error);
            });
        });
    }

    // Terminal.app fallback (새 창)
    const terminalScript = `
tell application "Terminal"
    activate
    do script "cd '${escapedPath}'"
end tell`;
    return new Promise((resolve) => {
        exec(`osascript -e '${terminalScript}'`, (error) => {
            resolve(!error);
        });
    });
}

/**
 * Interactive 모드 (메인 TUI) - 단일 실행
 */
async function interactiveMode(workspaceRoot: string) {
    const result = await runInteraction(workspaceRoot);
    if (result?.cdPath) {
        // AppleScript로 현재 터미널에 cd 명령어 전송
        await cdInCurrentTerminal(result.cdPath);
    }
}

/**
 * Persistent Interactive 모드 - 루프
 */
async function persistentInteractiveMode(workspaceRoot: string) {
    while (true) {
        console.clear();
        const result = await runInteraction(workspaceRoot, true);

        if (result?.exit) {
            break;
        }

        if (result?.cdPath) {
            // persistent 모드에서는 새 터미널 열기
            await openNewTerminal(result.cdPath);
            // 계속 루프 (종료 안 함)
        }

        // 삭제 등의 작업 후 계속 루프
    }
}

/**
 * 스레드 삭제 실행
 */
async function executeDelete(thread: any, workspaceRoot: string): Promise<void> {
    if (thread.type === 'local') {
        const confirmed = await confirmDeleteLocal(thread.name);
        if (confirmed) {
            await removeLocalThread(workspaceRoot, thread.id);
            console.log(chalk.green(`✓ Deleted local thread: ${thread.name}`));
        } else {
            console.log(chalk.dim('Cancelled.'));
        }
    } else {
        const { confirmed, removeGitWorktree } = await confirmDeleteWorktree(thread.name);
        if (confirmed && removeGitWorktree) {
            try {
                await gitAdapter.removeWorktree(thread.path, workspaceRoot, true);
                await gitAdapter.deleteBranch(thread.branch!, workspaceRoot, true);
                console.log(chalk.green(`✓ Deleted worktree and branch: ${thread.name}`));
            } catch (error) {
                console.error(chalk.red(`Failed to delete: ${(error as Error).message}`));
            }
        } else if (confirmed) {
            console.log(chalk.yellow('Worktree kept.'));
        } else {
            console.log(chalk.dim('Cancelled.'));
        }
    }
}

/**
 * 단일 상호작용 실행
 */
async function runInteraction(workspaceRoot: string, _persistent = false): Promise<{ cdPath?: string; exit?: boolean } | null> {
    const threads = await getAllThreads(workspaceRoot);
    const repoName = path.basename(workspaceRoot);

    const choice = await selectThread(threads, repoName);

    if (choice.type === 'exit') {
        return { exit: true };
    }

    let targetPath: string | undefined;

    switch (choice.type) {
        case 'existing': {
            const thread = choice.thread!;
            const action = await selectThreadAction(thread.name);

            if (action === 'open') {
                targetPath = thread.path;
            } else if (action === 'delete') {
                await executeDelete(thread, workspaceRoot);
                return null; // 삭제 후 루프 계속
            } else {
                // back
                return null;
            }
            break;
        }

        case 'delete-selected': {
            // d키로 직접 삭제
            const thread = choice.thread!;
            await executeDelete(thread, workspaceRoot);
            return null;
        }

        case 'new': {
            const newType = await selectNewThreadType();

            if (newType === 'back') {
                return null;
            }

            if (newType === 'worktree') {
                const defaultBasePath = path.join(
                    path.dirname(workspaceRoot),
                    `${repoName}.worktree`
                );
                const form = await newWorktreeForm(defaultBasePath);

                if (!form) {
                    return null; // 취소됨
                }

                try {
                    await gitAdapter.createWorktree(
                        form.path,
                        form.name,
                        workspaceRoot
                    );
                    console.log(chalk.green(`✓ Created worktree: ${form.name}`));

                    // 설정 파일에서 복사할 패턴 읽어서 파일 복사
                    await copyWorktreeFiles(workspaceRoot, form.path);

                    targetPath = form.path;
                } catch (error) {
                    console.error(
                        chalk.red(
                            `Failed to create worktree: ${(error as Error).message}`
                        )
                    );
                }
            } else {
                const name = await newLocalForm();
                if (!name) {
                    return null; // 취소됨
                }
                await addLocalThread(workspaceRoot, name);
                console.log(chalk.green(`✓ Created local thread: ${name}`));
                targetPath = workspaceRoot;
            }
            break;
        }
    }

    if (targetPath) {
        return { cdPath: targetPath };
    }

    return null;
}

main().catch((error) => {
    // Ctrl+C로 종료 시 조용히 종료
    if (error.message?.includes('SIGINT') || error.message?.includes('force closed')) {
        process.exit(130);
    }
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
});
