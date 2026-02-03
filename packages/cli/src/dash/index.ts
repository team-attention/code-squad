import chalk from 'chalk';
import * as path from 'path';
import { confirm } from '@inquirer/prompts';
import { TmuxAdapter } from './TmuxAdapter.js';
import { GitAdapter } from '../adapters/GitAdapter.js';
import { runInkDashboard } from './InkDashboard.js';
import { loadAllThreads } from './threadHelpers.js';

const tmuxAdapter = new TmuxAdapter();
const gitAdapter = new GitAdapter();

/**
 * tmux 자동 설치
 */
async function installTmux(): Promise<boolean> {
    const platform = process.platform;
    const { spawn } = await import('child_process');

    let command: string;
    let args: string[];

    if (platform === 'darwin') {
        // macOS: brew 사용
        console.log(chalk.dim('Installing tmux via Homebrew...'));
        command = 'brew';
        args = ['install', 'tmux'];
    } else if (platform === 'linux') {
        // Linux: apt 또는 yum
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);

        // apt 사용 가능 여부 확인
        try {
            await execAsync('which apt-get');
            console.log(chalk.dim('Installing tmux via apt...'));
            command = 'sudo';
            args = ['apt-get', 'install', '-y', 'tmux'];
        } catch {
            // yum 사용
            try {
                await execAsync('which yum');
                console.log(chalk.dim('Installing tmux via yum...'));
                command = 'sudo';
                args = ['yum', 'install', '-y', 'tmux'];
            } catch {
                console.error(chalk.red('Could not find apt or yum package manager'));
                return false;
            }
        }
    } else {
        console.error(chalk.red(`Unsupported platform: ${platform}`));
        console.error(chalk.dim('Please install tmux manually'));
        return false;
    }

    return new Promise((resolve) => {
        const proc = spawn(command, args, { stdio: 'inherit' });

        proc.on('close', (code) => {
            if (code === 0) {
                console.log(chalk.green('✓ tmux installed successfully'));
                resolve(true);
            } else {
                console.error(chalk.red(`Installation failed with code ${code}`));
                resolve(false);
            }
        });

        proc.on('error', (error) => {
            console.error(chalk.red(`Installation error: ${error.message}`));
            resolve(false);
        });
    });
}

/**
 * 대시보드 모드 실행
 */
export async function runDash(workspaceRoot: string): Promise<void> {
    const repoName = path.basename(workspaceRoot);

    // tmux 설치 확인
    if (!await tmuxAdapter.isTmuxAvailable()) {
        console.log(chalk.yellow('tmux is not installed.'));
        console.log(chalk.dim('tmux is required for the dashboard mode.'));
        console.log('');

        const shouldInstall = await confirm({
            message: 'Would you like to install tmux now?',
            default: true,
        });

        if (shouldInstall) {
            const success = await installTmux();
            if (!success) {
                console.error(chalk.red('\nFailed to install tmux.'));
                console.error(chalk.dim('Please install manually:'));
                console.error(chalk.dim('  macOS: brew install tmux'));
                console.error(chalk.dim('  Ubuntu: sudo apt install tmux'));
                process.exit(1);
            }
            console.log('');
        } else {
            console.log(chalk.dim('\nTo use dashboard mode, install tmux:'));
            console.error(chalk.dim('  macOS: brew install tmux'));
            console.error(chalk.dim('  Ubuntu: sudo apt install tmux'));
            console.log(chalk.dim('\nOr use legacy mode: csq --legacy'));
            process.exit(0);
        }
    }

    // tmux 세션 내부인지 확인
    if (!tmuxAdapter.isInsideTmux()) {
        // tmux 세션 외부에서 실행됨 → 새 세션 생성 또는 기존 세션에 attach
        const sessionName = `csq-${repoName}`;

        try {
            // 기존 세션 확인
            const isNewSession = await tmuxAdapter.ensureSession(sessionName, workspaceRoot);

            // UX 설정 적용 (마우스 모드, 테두리 강조 등)
            await tmuxAdapter.applyUXSettings();

            if (isNewSession) {
                console.log(chalk.dim('Starting new tmux session...'));

                // 현재 실행 중인 스크립트의 절대 경로 사용
                const scriptPath = process.argv[1];
                const nodeCmd = `node "${scriptPath}"`;

                // 세션 내에서 같은 스크립트 재실행
                await tmuxAdapter.sendKeys(`${sessionName}:0`, nodeCmd);
                await tmuxAdapter.sendEnter(`${sessionName}:0`);
            } else {
                console.log(chalk.dim('Attaching to existing session...'));
            }

            // attach
            const { spawn } = await import('child_process');
            const tmux = spawn('tmux', ['attach-session', '-t', sessionName], {
                stdio: 'inherit',
            });

            await new Promise<void>((resolve, reject) => {
                tmux.on('close', (code) => {
                    if (code === 0) {
                        resolve();
                    } else {
                        reject(new Error(`tmux exited with code ${code}`));
                    }
                });
                tmux.on('error', reject);
            });
        } catch (error) {
            console.error(chalk.red(`Failed to start tmux session: ${(error as Error).message}`));
            process.exit(1);
        }

        return;
    }

    // tmux 세션 내부에서 실행됨 → 대시보드 UI 실행
    console.clear();
    console.log(chalk.bold.cyan('Code Squad Dashboard'));
    console.log(chalk.dim('Setting up layout...'));

    // UX 설정 적용 (마우스 모드, 테두리 강조 등)
    await tmuxAdapter.applyUXSettings();

    try {
        // 현재 pane ID 저장 (대시보드 pane)
        const dashPaneId = await tmuxAdapter.getCurrentPaneId();
        if (!dashPaneId) {
            throw new Error('Could not get current pane ID');
        }

        // 스레드 목록 로드
        const threads = await loadAllThreads(workspaceRoot);

        // 초기 레이아웃 설정: 좌측에 대시보드(20%), 우측에 터미널(80%)
        if (threads.length === 0) {
            await tmuxAdapter.splitWindow('v', workspaceRoot, 80);
        } else {
            await tmuxAdapter.splitWindow('v', threads[0].path, 80);
        }

        // 대시보드 pane으로 포커스 복귀
        await tmuxAdapter.selectPane(dashPaneId);

        console.clear();

        // 대시보드 UI 실행 (Ink)
        const result = await runInkDashboard({
            workspaceRoot,
            repoName,
            initialThreads: threads,
            tmuxAdapter,
            gitAdapter,
            dashPaneId,
        });

        if (result.action === 'quit') {
            console.log(chalk.dim('Closing session...'));
            // 대시보드 종료 시 tmux 세션 전체 종료
            await tmuxAdapter.killCurrentSession();
        }
    } catch (error) {
        console.error(chalk.red(`Dashboard error: ${(error as Error).message}`));
        process.exit(1);
    }
}
