import {
    createPrompt,
    useState,
    useKeypress,
    usePrefix,
    isEnterKey,
} from '@inquirer/core';
import chalk from 'chalk';
import type { DashboardState, PaneInfo } from './types.js';
import type { WorktreeInfo } from '@code-squad/core';
import { TmuxAdapter } from './TmuxAdapter.js';
import { GitAdapter } from '../adapters/GitAdapter.js';
import { loadConfig, getWorktreeCopyPatterns } from '../config.js';
import { copyFilesWithPatterns } from '../fileUtils.js';
import * as path from 'path';

interface DashboardConfig {
    workspaceRoot: string;
    repoName: string;
    initialWorktrees: WorktreeInfo[];
    tmuxAdapter: TmuxAdapter;
    gitAdapter: GitAdapter;
    dashPaneId: string;
}

interface DashboardResult {
    action: 'quit' | 'focus';
    paneId?: string;
}

type InputMode = 'normal' | 'new-worktree' | 'confirm-delete';

/**
 * 대시보드 TUI 프롬프트
 */
const dashboardPrompt = createPrompt<DashboardResult, DashboardConfig>(
    (config, done) => {
        const { workspaceRoot, repoName, initialWorktrees, tmuxAdapter, gitAdapter, dashPaneId } = config;

        const [worktrees, setWorktrees] = useState<WorktreeInfo[]>(initialWorktrees);
        const [panes, setPanes] = useState<PaneInfo[]>([]);
        const [selectedIndex, setSelectedIndex] = useState(0);
        const [status, setStatus] = useState<string>('');
        const [isProcessing, setIsProcessing] = useState(false);

        // 인라인 입력 모드
        const [inputMode, setInputMode] = useState<InputMode>('normal');
        const [inputBuffer, setInputBuffer] = useState('');
        const prefix = usePrefix({ status: 'idle' });

        useKeypress(async (key, rl) => {
            if (isProcessing) return;

            // 입력 모드일 때
            if (inputMode === 'new-worktree') {
                if (key.name === 'escape') {
                    setInputMode('normal');
                    setInputBuffer('');
                    setStatus('Cancelled');
                } else if (isEnterKey(key)) {
                    const branchName = inputBuffer.trim();
                    if (!branchName) {
                        setStatus('Branch name required');
                        return;
                    }

                    setIsProcessing(true);
                    setInputMode('normal');
                    setStatus(`Creating ${branchName}...`);

                    try {
                        const defaultBasePath = path.join(
                            path.dirname(workspaceRoot),
                            `${repoName}.worktree`
                        );
                        const wtPath = path.join(defaultBasePath, branchName);

                        // Git worktree 생성
                        await gitAdapter.createWorktree(wtPath, branchName, workspaceRoot);

                        // 파일 복사
                        const configData = await loadConfig(workspaceRoot);
                        const patterns = getWorktreeCopyPatterns(configData);
                        if (patterns.length > 0) {
                            await copyFilesWithPatterns(workspaceRoot, wtPath, patterns);
                        }

                        // 새 pane 생성 (오른쪽 영역에)
                        // 기존 pane 중 대시보드가 아닌 pane을 찾아서 거기서 분할
                        const existingPanes = await tmuxAdapter.listPanes();
                        const rightPanes = existingPanes.filter(p => p.id !== dashPaneId);

                        let newPaneId: string;
                        if (rightPanes.length > 0) {
                            // 오른쪽 영역의 마지막 pane에서 가로 분할 (좌우 나란히)
                            newPaneId = await tmuxAdapter.splitPane(rightPanes[rightPanes.length - 1].id, 'v', wtPath);
                        } else {
                            // 아직 오른쪽 pane이 없으면 대시보드에서 분할
                            newPaneId = await tmuxAdapter.splitWindow('v', wtPath);
                        }

                        // 오른쪽 pane들 균등 분할
                        await tmuxAdapter.distributeRightPanes(dashPaneId);

                        // pane 목록 업데이트
                        const newPane: PaneInfo = {
                            id: newPaneId,
                            index: panes.length,
                            worktreePath: wtPath,
                            worktreeName: branchName,
                            active: false,
                        };
                        setPanes([...panes, newPane]);

                        // worktree 목록 새로고침
                        const updatedWorktrees = await gitAdapter.listWorktrees(workspaceRoot);
                        setWorktrees(updatedWorktrees);
                        setSelectedIndex(updatedWorktrees.length - 1);

                        // 대시보드 pane으로 포커스 복귀
                        await tmuxAdapter.selectPane(dashPaneId);

                        setStatus(`Created: ${branchName}`);
                        setInputBuffer('');
                    } catch (error) {
                        setStatus(`Error: ${(error as Error).message}`);
                    }

                    setIsProcessing(false);
                } else if (key.name === 'backspace') {
                    setInputBuffer(inputBuffer.slice(0, -1));
                } else if (key.name && key.name.length === 1 && !key.ctrl) {
                    // 단일 문자 입력
                    setInputBuffer(inputBuffer + key.name);
                }
                return;
            }

            // 삭제 확인 모드
            if (inputMode === 'confirm-delete') {
                if (key.name === 'y') {
                    const selected = worktrees[selectedIndex];
                    if (!selected) {
                        setInputMode('normal');
                        return;
                    }

                    setIsProcessing(true);
                    setInputMode('normal');
                    setStatus(`Deleting ${selected.branch}...`);

                    try {
                        // 해당 pane 종료
                        const pane = panes.find(p => p.worktreePath === selected.path);
                        if (pane) {
                            await tmuxAdapter.killPane(pane.id);
                            setPanes(panes.filter(p => p.id !== pane.id));
                        }

                        // Git worktree 삭제
                        await gitAdapter.removeWorktree(selected.path, workspaceRoot, true);
                        await gitAdapter.deleteBranch(selected.branch, workspaceRoot, true);

                        // worktree 목록 새로고침
                        const updatedWorktrees = await gitAdapter.listWorktrees(workspaceRoot);
                        setWorktrees(updatedWorktrees);
                        setSelectedIndex(Math.min(selectedIndex, Math.max(0, updatedWorktrees.length - 1)));

                        // 오른쪽 pane들 균등 분할
                        await tmuxAdapter.distributeRightPanes(dashPaneId);

                        setStatus(`Deleted: ${selected.branch}`);
                    } catch (error) {
                        setStatus(`Error: ${(error as Error).message}`);
                    }

                    setIsProcessing(false);
                } else if (key.name === 'n' || key.name === 'escape') {
                    setInputMode('normal');
                    setStatus('Cancelled');
                }
                return;
            }

            // 일반 모드
            if (key.name === 'j' || key.name === 'down') {
                setSelectedIndex((selectedIndex + 1) % Math.max(worktrees.length, 1));
            } else if (key.name === 'k' || key.name === 'up') {
                setSelectedIndex((selectedIndex - 1 + Math.max(worktrees.length, 1)) % Math.max(worktrees.length, 1));
            } else if (key.name === 'q') {
                done({ action: 'quit' });
            } else if (isEnterKey(key)) {
                // 선택된 워크트리의 pane으로 포커스 (없으면 생성)
                const selected = worktrees[selectedIndex];
                if (selected) {
                    let pane = panes.find(p => p.worktreePath === selected.path);

                    if (!pane) {
                        // pane이 없으면 새로 생성
                        setStatus(`Opening ${selected.branch}...`);

                        const existingPanes = await tmuxAdapter.listPanes();
                        const rightPanes = existingPanes.filter(p => p.id !== dashPaneId);

                        let newPaneId: string;
                        if (rightPanes.length > 0) {
                            // 가로 분할 (좌우 나란히)
                            newPaneId = await tmuxAdapter.splitPane(rightPanes[rightPanes.length - 1].id, 'v', selected.path);
                        } else {
                            newPaneId = await tmuxAdapter.splitWindow('v', selected.path);
                        }

                        // 오른쪽 pane들 균등 분할
                        await tmuxAdapter.distributeRightPanes(dashPaneId);

                        const newPane: PaneInfo = {
                            id: newPaneId,
                            index: panes.length,
                            worktreePath: selected.path,
                            worktreeName: selected.branch,
                            active: true,
                        };
                        setPanes([...panes, newPane]);
                        pane = newPane;
                    }

                    await tmuxAdapter.selectPane(pane.id);
                    setStatus(`Focused: ${selected.branch}`);
                }
            } else if (key.name === 'n') {
                setInputMode('new-worktree');
                setInputBuffer('');
                setStatus('');
            } else if (key.name === 'd') {
                const selected = worktrees[selectedIndex];
                if (selected) {
                    setInputMode('confirm-delete');
                    setStatus('');
                } else {
                    setStatus('No worktree selected');
                }
            } else if (key.name === ',' || key.name === 'left') {
                // 선택된 워크트리의 pane을 왼쪽으로 swap
                const selected = worktrees[selectedIndex];
                if (selected) {
                    const pane = panes.find(p => p.worktreePath === selected.path);
                    if (pane) {
                        try {
                            await tmuxAdapter.swapPane(pane.id, 'left');
                            setStatus(`Moved ${selected.branch} left`);
                        } catch {
                            setStatus('Cannot move further left');
                        }
                    } else {
                        setStatus('No pane for this worktree');
                    }
                }
            } else if (key.name === '.' || key.name === 'right') {
                // 선택된 워크트리의 pane을 오른쪽으로 swap
                const selected = worktrees[selectedIndex];
                if (selected) {
                    const pane = panes.find(p => p.worktreePath === selected.path);
                    if (pane) {
                        try {
                            await tmuxAdapter.swapPane(pane.id, 'right');
                            setStatus(`Moved ${selected.branch} right`);
                        } catch {
                            setStatus('Cannot move further right');
                        }
                    } else {
                        setStatus('No pane for this worktree');
                    }
                }
            } else if (key.name === 'r') {
                setIsProcessing(true);
                setStatus('Refreshing...');

                try {
                    const updatedWorktrees = await gitAdapter.listWorktrees(workspaceRoot);
                    setWorktrees(updatedWorktrees);
                    const updatedPanes = await tmuxAdapter.listPanes();
                    setPanes(updatedPanes.map((p, i) => ({
                        id: p.id,
                        index: p.index,
                        worktreePath: p.cwd,
                        worktreeName: path.basename(p.cwd),
                        active: p.active,
                    })));
                    setStatus('Refreshed');
                } catch (error) {
                    setStatus(`Error: ${(error as Error).message}`);
                }

                setIsProcessing(false);
            }
        });

        // 렌더링 - ANSI escape로 화면 클리어
        const clearScreen = '\x1B[2J\x1B[H';
        const header = chalk.bold(`${repoName}`) + chalk.dim(` (${worktrees.length} worktrees)`);

        const list = worktrees.length === 0
            ? [chalk.dim('  No worktrees')]
            : worktrees.map((wt, i) => {
                const isSelected = i === selectedIndex;
                const cursor = isSelected ? chalk.cyan('❯') : ' ';
                const name = isSelected ? chalk.cyan(wt.branch) : wt.branch;
                const pane = panes.find(p => p.worktreePath === wt.path);
                const paneIndicator = pane
                    ? (pane.active ? chalk.green('●') : chalk.dim('○'))
                    : chalk.dim('·');
                return `${cursor} ${paneIndicator} ${name}`;
            });

        // 입력 모드별 추가 UI
        let inputLine = '';
        if (inputMode === 'new-worktree') {
            inputLine = chalk.yellow('\nNew branch: ') + inputBuffer + chalk.dim('█');
        } else if (inputMode === 'confirm-delete') {
            const selected = worktrees[selectedIndex];
            inputLine = chalk.red(`\nDelete "${selected?.branch}"? `) + chalk.dim('(y/n)');
        }

        const statusLine = status ? chalk.yellow(`\n${status}`) : '';
        const dashHint = inputMode === 'normal'
            ? chalk.dim('\n↑↓ Navigate │ n New │ d Delete │ Enter Open │ q Quit')
            : chalk.dim('\nEnter Confirm │ Esc Cancel');
        const tmuxHint = chalk.dim('\nCtrl+b m: Move pane');

        return `${clearScreen}${prefix} ${header}\n${list.join('\n')}${inputLine}${statusLine}${dashHint}${tmuxHint}`;
    }
);

/**
 * 대시보드 실행
 */
export async function runDashboardUI(config: DashboardConfig): Promise<DashboardResult> {
    return dashboardPrompt(config);
}
