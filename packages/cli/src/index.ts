#!/usr/bin/env node

import * as path from 'path';
import chalk from 'chalk';
import { GitAdapter } from './adapters/GitAdapter.js';
import { confirm } from '@inquirer/prompts';
import type { WorktreeInfo } from '@code-squad/core';
import { runFlip } from './flip/index.js';
import { loadConfig, getWorktreeCopyPatterns } from './config.js';
import { copyFilesWithPatterns } from './fileUtils.js';

const hasShellWrapper = !!process.env.CSQ_WRAPPED;

// Ctrl+C 시 깔끔하게 종료
process.on('SIGINT', () => {
    process.exit(130);
});

const gitAdapter = new GitAdapter();

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    // --init: shell function 출력
    if (command === '--init' || command === 'init') {
        printShellInit();
        return;
    }

    // flip 서브커맨드는 git repo 체크 없이 바로 실행
    if (command === 'flip') {
        await runFlip(args.slice(1));
        return;
    }

    const workspaceRoot = await findGitRoot(process.cwd());

    if (!workspaceRoot) {
        console.error(chalk.red('Error: Not a git repository'));
        process.exit(1);
    }

    // 서브커맨드 처리
    switch (command) {
        case 'new':
            await createWorktreeCommand(workspaceRoot, args.slice(1));
            break;
        case 'quit':
            await quitWorktreeCommand();
            break;
        case 'list':
            await listWorktrees(workspaceRoot);
            break;
        default:
            if (process.stdin.isTTY) {
                const { runTui } = await import('./tui/App.js');
                const selectedPath = await runTui(workspaceRoot);
                if (selectedPath) {
                    cdToDir(selectedPath);
                }
            } else {
                await listWorktrees(workspaceRoot);
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
    return cwd;
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
  output=$(CSQ_WRAPPED=1 command csq "\$@")
  local exit_code=\$?

  if [[ \$exit_code -ne 0 ]]; then
    return \$exit_code
  fi

  # stdout의 마지막 줄이 디렉토리면 cd
  if [[ -n "\$output" ]]; then
    local last_line=$(echo "\$output" | tail -1)
    if [[ -d "\$last_line" ]]; then
      local rest=$(echo "\$output" | sed '\$d')
      [[ -n "\$rest" ]] && echo "\$rest"
      cd "\$last_line"
    else
      echo "\$output"
    fi
  fi
}
`.trim();

    console.log(script);
}

/**
 * 디렉토리 이동: shell function이면 stdout으로 경로 출력, 아니면 경고
 */
function cdToDir(targetDir: string): void {
    if (hasShellWrapper) {
        process.stdout.write(targetDir + '\n');
        return;
    }

    console.error(chalk.yellow('⚠ Shell integration not detected. Restart your terminal to enable auto-cd.'));
    console.error(chalk.dim(`  cd ${targetDir}`));
}

/**
 * 워크트리 목록 출력
 */
async function listWorktrees(workspaceRoot: string) {
    const worktrees = await gitAdapter.listWorktrees(workspaceRoot);

    if (worktrees.length === 0) {
        console.log(chalk.dim('No worktrees found.'));
        return;
    }

    for (const wt of worktrees) {
        console.log(`${chalk.cyan('[W]')} ${wt.branch.padEnd(20)} ${chalk.dim(wt.path)}`);
    }
}

/**
 * csq new 서브커맨드 처리
 */
async function createWorktreeCommand(workspaceRoot: string, args: string[]) {
    const name = args.find(a => !a.startsWith('-'));

    if (!name) {
        console.error(chalk.red('Error: Name is required'));
        console.error(chalk.dim('Usage: csq new <name>'));
        process.exit(1);
    }

    const repoName = path.basename(workspaceRoot);
    const defaultBasePath = path.join(
        path.dirname(workspaceRoot),
        `${repoName}.worktree`
    );
    const worktreePath = path.join(defaultBasePath, name);

    try {
        await gitAdapter.createWorktree(worktreePath, name, workspaceRoot);
        console.error(chalk.green(`✓ Created worktree: ${name}`));

        // 설정 파일에서 복사할 패턴 읽어서 파일 복사
        await copyWorktreeFiles(workspaceRoot, worktreePath);

        cdToDir(worktreePath);
    } catch (error) {
        console.error(
            chalk.red(`Failed to create worktree: ${(error as Error).message}`)
        );
        process.exit(1);
    }
}

/**
 * csq quit 서브커맨드 처리
 */
async function quitWorktreeCommand() {
    const cwd = process.cwd();
    const context = await gitAdapter.getWorktreeContext(cwd);

    if (!context.isWorktree) {
        console.error(chalk.red('Error: Not in a worktree'));
        process.exit(1);
    }

    if (!context.mainRoot || !context.branch) {
        console.error(chalk.red('Error: Could not determine worktree context'));
        process.exit(1);
    }

    // dirty state 확인
    const isDirty = await gitAdapter.hasDirtyState(cwd);
    if (isDirty) {
        const confirmed = await confirm({
            message: 'Uncommitted changes detected. Delete anyway?',
            default: false,
        });
        if (!confirmed) {
            console.log(chalk.dim('Cancelled.'));
            process.exit(0);
        }
    }

    try {
        // 워크트리 삭제
        await gitAdapter.removeWorktree(context.currentPath, context.mainRoot, true);
        // 브랜치 삭제
        await gitAdapter.deleteBranch(context.branch, context.mainRoot, true);

        console.error(chalk.green(`✓ Deleted worktree and branch: ${context.branch}`));
        cdToDir(context.mainRoot);
    } catch (error) {
        console.error(chalk.red(`Failed to quit: ${(error as Error).message}`));
        process.exit(1);
    }
}

/**
 * 워크트리에 설정된 패턴의 파일 복사
 */
async function copyWorktreeFiles(sourceRoot: string, destRoot: string): Promise<void> {
    const config = await loadConfig(sourceRoot);
    const patterns = getWorktreeCopyPatterns(config);

    if (patterns.length === 0) {
        return;
    }

    const { copied, failed } = await copyFilesWithPatterns(sourceRoot, destRoot, patterns);

    if (copied.length > 0) {
        console.error(chalk.green(`✓ Copied ${copied.length} file(s) to worktree`));
    }

    if (failed.length > 0) {
        console.error(chalk.yellow(`⚠ Failed to copy ${failed.length} file(s)`));
    }
}

main().catch((error) => {
    // Ctrl+C로 종료 시 조용히 종료
    if (error.message?.includes('SIGINT') || error.message?.includes('force closed')) {
        process.exit(130);
    }
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
});
