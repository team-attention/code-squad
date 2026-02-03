import React, { useState, useEffect, useCallback } from 'react';
import { render, Box, Text, useInput, useApp, useStdin } from 'ink';
import TextInput from 'ink-text-input';
import type { ThreadInfo, PaneInfo, IsolationMode } from './types.js';
import { TmuxAdapter } from './TmuxAdapter.js';
import { GitAdapter } from '../adapters/GitAdapter.js';
import { loadAllThreads, createThread, deleteThread } from './threadHelpers.js';
import path from 'node:path';

// 마우스 이벤트 파싱
interface MouseEvent {
    button: number;
    col: number;
    row: number;
    release: boolean;
}

function parseMouseEvent(data: string): MouseEvent | null {
    const match = data.match(/\x1b\[<(\d+);(\d+);(\d+)([Mm])/);
    if (!match) return null;
    return {
        button: parseInt(match[1], 10),
        col: parseInt(match[2], 10),
        row: parseInt(match[3], 10),
        release: match[4] === 'm',
    };
}

// 마우스 훅
function useMouse(onMouseClick: (row: number, col: number) => void, enabled: boolean = true) {
    const { stdin, setRawMode } = useStdin();

    useEffect(() => {
        if (!enabled) {
            // 마우스 모드 비활성화
            process.stdout.write('\x1b[?1006l');
            process.stdout.write('\x1b[?1000l');
            return;
        }

        // 마우스 모드 활성화
        process.stdout.write('\x1b[?1000h');
        process.stdout.write('\x1b[?1006h');

        const handleData = (data: Buffer) => {
            const str = data.toString();
            if (str.includes('\x1b[<')) {
                const mouseEvent = parseMouseEvent(str);
                if (mouseEvent && mouseEvent.button === 0 && !mouseEvent.release) {
                    onMouseClick(mouseEvent.row, mouseEvent.col);
                }
            }
        };

        stdin?.on('data', handleData);

        return () => {
            process.stdout.write('\x1b[?1006l');
            process.stdout.write('\x1b[?1000l');
            stdin?.off('data', handleData);
        };
    }, [stdin, onMouseClick, enabled]);
}

// 입력 모드
type InputMode = 'normal' | 'new-thread' | 'confirm-delete';

interface DashboardProps {
    workspaceRoot: string;
    repoName: string;
    initialThreads: ThreadInfo[];
    tmuxAdapter: TmuxAdapter;
    gitAdapter: GitAdapter;
    dashPaneId: string;
    onQuit: () => void;
}

// 스레드 카드 컴포넌트
function ThreadCard({
    thread,
    isSelected,
    pane,
}: {
    thread: ThreadInfo;
    isSelected: boolean;
    pane?: PaneInfo;
}) {
    const borderColor = isSelected ? 'cyan' : 'gray';
    const nameColor = isSelected ? 'cyan' : 'white';

    const statusIcon = pane
        ? pane.active ? '●' : '○'
        : '○';
    const statusColor = pane
        ? pane.active ? 'green' : 'blue'
        : 'gray';

    const typeBadge = thread.isolationMode === 'worktree' ? 'W' : 'L';
    const typeColor = thread.isolationMode === 'worktree' ? 'green' : 'gray';

    return (
        <Box
            flexDirection="column"
            borderStyle="round"
            borderColor={borderColor}
            paddingX={1}
            marginBottom={0}
        >
            <Box>
                <Text color={statusColor}>{statusIcon} </Text>
                <Text color={nameColor} bold={isSelected}>{thread.name}</Text>
                {isSelected && <Text color="red"> ✕</Text>}
            </Box>
            <Box>
                <Text color={typeColor}>{typeBadge}</Text>
                <Text color="gray"> {thread.branch || 'local'}</Text>
            </Box>
        </Box>
    );
}

// 새 스레드 폼 컴포넌트
function NewThreadForm({
    value,
    onChange,
    isolationMode,
    onToggleMode,
    onSubmit,
    onCancel,
}: {
    value: string;
    onChange: (value: string) => void;
    isolationMode: IsolationMode;
    onToggleMode: () => void;
    onSubmit: () => void;
    onCancel: () => void;
}) {
    useInput((input, key) => {
        if (key.escape) {
            onCancel();
        } else if (key.return) {
            onSubmit();
        } else if (key.tab) {
            onToggleMode();
        }
    });

    const modeColor = isolationMode === 'worktree' ? 'green' : 'gray';
    const modeText = isolationMode === 'worktree' ? 'Worktree' : 'Local';

    return (
        <Box
            flexDirection="column"
            borderStyle="round"
            borderColor="yellow"
            paddingX={1}
        >
            <Text color="yellow" bold>+ New Thread</Text>
            <Box marginTop={1}>
                <Text>Name: </Text>
                <TextInput
                    value={value}
                    onChange={onChange}
                    placeholder="thread-name"
                />
            </Box>
            <Box marginTop={1}>
                <Text>Mode: </Text>
                <Text color={modeColor}>● {modeText}</Text>
                <Text color="gray"> (Tab to switch)</Text>
            </Box>
            <Box marginTop={1}>
                <Text color="gray">Enter: Create  Esc: Cancel</Text>
            </Box>
        </Box>
    );
}

// 삭제 확인 컴포넌트
function DeleteConfirm({
    threadName,
    onConfirm,
    onCancel,
}: {
    threadName: string;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    useInput((input, key) => {
        if (input === 'y' || input === 'Y') {
            onConfirm();
        } else if (input === 'n' || input === 'N' || key.escape) {
            onCancel();
        }
    });

    return (
        <Box
            borderStyle="round"
            borderColor="red"
            paddingX={1}
        >
            <Text color="red">Delete "{threadName}"? </Text>
            <Text color="gray">(y/n)</Text>
        </Box>
    );
}

// 힌트 바 컴포넌트
function HintBar({ mode }: { mode: InputMode }) {
    if (mode === 'new-thread') {
        return (
            <Box marginTop={1}>
                <Text color="gray">Tab: mode  Enter: create  Esc: cancel</Text>
            </Box>
        );
    }

    return (
        <Box marginTop={1}>
            <Text color="gray">↑↓/jk: nav  +/n: new  Enter: open  d: del  q: quit</Text>
        </Box>
    );
}

// 메인 대시보드 컴포넌트
function Dashboard({
    workspaceRoot,
    repoName,
    initialThreads,
    tmuxAdapter,
    dashPaneId,
    onQuit,
}: DashboardProps) {
    const { exit } = useApp();

    const [threads, setThreads] = useState<ThreadInfo[]>(initialThreads);
    const [panes, setPanes] = useState<PaneInfo[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [inputMode, setInputMode] = useState<InputMode>('normal');
    const [newThreadName, setNewThreadName] = useState('');
    const [isolationMode, setIsolationMode] = useState<IsolationMode>('worktree');
    const [status, setStatus] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // 스레드 목록 새로고침
    const refreshThreads = useCallback(async () => {
        const currentPanes = await tmuxAdapter.listPanes();
        const paneInfos: PaneInfo[] = currentPanes
            .filter(p => p.id !== dashPaneId)
            .map((p, i) => ({
                id: p.id,
                index: p.index,
                worktreePath: p.cwd,
                worktreeName: path.basename(p.cwd),
                active: p.active,
            }));
        setPanes(paneInfos);

        const updatedThreads = await loadAllThreads(workspaceRoot, paneInfos);
        setThreads(updatedThreads);
        return { threads: updatedThreads, panes: paneInfos };
    }, [tmuxAdapter, dashPaneId, workspaceRoot]);

    // 터미널 pane 열기/포커스
    const openOrFocusPane = useCallback(async (thread: ThreadInfo) => {
        let pane = panes.find(p => p.worktreePath === thread.path);

        if (!pane) {
            setStatus(`Opening ${thread.name}...`);

            const existingPanes = await tmuxAdapter.listPanes();
            const rightPanes = existingPanes.filter(p => p.id !== dashPaneId);

            let newPaneId: string;
            if (rightPanes.length > 0) {
                newPaneId = await tmuxAdapter.splitPane(rightPanes[rightPanes.length - 1].id, 'v', thread.path);
            } else {
                newPaneId = await tmuxAdapter.splitWindow('v', thread.path);
            }

            await tmuxAdapter.distributeRightPanes(dashPaneId);

            const newPane: PaneInfo = {
                id: newPaneId,
                index: panes.length,
                worktreePath: thread.path,
                worktreeName: thread.name,
                active: true,
            };
            setPanes(prev => [...prev, newPane]);
            pane = newPane;
        }

        await tmuxAdapter.selectPane(pane.id);
        setStatus(`Focused: ${thread.name}`);
    }, [panes, tmuxAdapter, dashPaneId]);

    // 레이아웃 행 계산 (마우스 클릭 매핑용)
    // 헤더: 3줄 (border + content + border)
    // 새 스레드 버튼: 3줄 + margin
    // 스레드: 각 4줄 (border + name + meta + border)
    const HEADER_ROWS = 3;
    const NEW_THREAD_ROWS = 3;
    const THREAD_START_ROW = HEADER_ROWS + NEW_THREAD_ROWS + 2; // +1 margin each
    const THREAD_HEIGHT = 4;

    // 마우스 클릭 핸들러
    const handleMouseClick = useCallback((row: number, col: number) => {
        if (isProcessing || inputMode !== 'normal') return;

        // 새 스레드 버튼 클릭
        if (row >= HEADER_ROWS + 1 && row <= HEADER_ROWS + NEW_THREAD_ROWS + 1) {
            setInputMode('new-thread');
            setNewThreadName('');
            return;
        }

        // 스레드 리스트 클릭
        if (row >= THREAD_START_ROW && threads.length > 0) {
            const threadIndex = Math.floor((row - THREAD_START_ROW) / THREAD_HEIGHT);
            if (threadIndex >= 0 && threadIndex < threads.length) {
                setSelectedIndex(threadIndex);
                // 클릭하면 바로 열기
                openOrFocusPane(threads[threadIndex]);
            }
        }
    }, [isProcessing, inputMode, threads, openOrFocusPane]);

    // 마우스 이벤트 (normal 모드에서만 활성화)
    useMouse(handleMouseClick, inputMode === 'normal');

    // 키보드 입력 처리 (normal 모드)
    useInput(async (input, key) => {
        if (isProcessing) return;
        if (inputMode !== 'normal') return;

        if (input === 'j' || key.downArrow) {
            setSelectedIndex(prev => (prev + 1) % Math.max(threads.length, 1));
        } else if (input === 'k' || key.upArrow) {
            setSelectedIndex(prev => (prev - 1 + Math.max(threads.length, 1)) % Math.max(threads.length, 1));
        } else if (input === 'q') {
            onQuit();
            exit();
        } else if (key.return) {
            const selected = threads[selectedIndex];
            if (selected) {
                await openOrFocusPane(selected);
            }
        } else if (input === 'n' || input === '+') {
            setInputMode('new-thread');
            setNewThreadName('');
        } else if (input === 'd') {
            if (threads[selectedIndex]) {
                setInputMode('confirm-delete');
            }
        } else if (input === 'r') {
            setIsProcessing(true);
            setStatus('Refreshing...');
            await refreshThreads();
            setStatus('Refreshed');
            setIsProcessing(false);
        }
    });

    // 새 스레드 생성
    const handleCreateThread = async () => {
        if (!newThreadName.trim()) {
            setStatus('Thread name required');
            return;
        }

        setIsProcessing(true);
        setStatus(`Creating ${newThreadName}...`);

        try {
            const newThread = await createThread(workspaceRoot, newThreadName.trim(), isolationMode);

            const existingPanes = await tmuxAdapter.listPanes();
            const rightPanes = existingPanes.filter(p => p.id !== dashPaneId);

            if (rightPanes.length > 0) {
                await tmuxAdapter.splitPane(rightPanes[rightPanes.length - 1].id, 'v', newThread.path);
            } else {
                await tmuxAdapter.splitWindow('v', newThread.path);
            }

            await tmuxAdapter.distributeRightPanes(dashPaneId);
            await tmuxAdapter.selectPane(dashPaneId);

            await refreshThreads();
            setSelectedIndex(threads.length);
            setInputMode('normal');
            setNewThreadName('');
            setStatus(`Created: ${newThreadName}`);
        } catch (error) {
            setStatus(`Error: ${(error as Error).message}`);
        }

        setIsProcessing(false);
    };

    // 스레드 삭제
    const handleDeleteThread = async () => {
        const selected = threads[selectedIndex];
        if (!selected) return;

        setIsProcessing(true);
        setStatus(`Deleting ${selected.name}...`);

        try {
            if (selected.paneId) {
                await tmuxAdapter.killPane(selected.paneId);
            }

            await deleteThread(workspaceRoot, selected);

            const { threads: updatedThreads } = await refreshThreads();
            setSelectedIndex(Math.min(selectedIndex, Math.max(0, updatedThreads.length - 1)));

            await tmuxAdapter.distributeRightPanes(dashPaneId);
            setInputMode('normal');
            setStatus(`Deleted: ${selected.name}`);
        } catch (error) {
            setStatus(`Error: ${(error as Error).message}`);
            setInputMode('normal');
        }

        setIsProcessing(false);
    };

    return (
        <Box flexDirection="column" padding={1}>
            {/* 헤더 */}
            <Box
                borderStyle="round"
                borderColor="gray"
                paddingX={1}
                marginBottom={1}
            >
                <Text bold color="white">{repoName}</Text>
                <Text color="gray"> ({threads.length} threads)</Text>
            </Box>

            {/* 새 스레드 폼 또는 버튼 */}
            {inputMode === 'new-thread' ? (
                <NewThreadForm
                    value={newThreadName}
                    onChange={setNewThreadName}
                    isolationMode={isolationMode}
                    onToggleMode={() => setIsolationMode(m => m === 'worktree' ? 'local' : 'worktree')}
                    onSubmit={handleCreateThread}
                    onCancel={() => {
                        setInputMode('normal');
                        setNewThreadName('');
                    }}
                />
            ) : (
                <Box
                    borderStyle="round"
                    borderColor="gray"
                    paddingX={1}
                    marginBottom={1}
                >
                    <Text color="gray">+ New Thread (press + or n)</Text>
                </Box>
            )}

            {/* 삭제 확인 */}
            {inputMode === 'confirm-delete' && threads[selectedIndex] && (
                <DeleteConfirm
                    threadName={threads[selectedIndex].name}
                    onConfirm={handleDeleteThread}
                    onCancel={() => setInputMode('normal')}
                />
            )}

            {/* 스레드 리스트 */}
            <Box flexDirection="column" marginTop={1}>
                {threads.length === 0 ? (
                    <Box borderStyle="round" borderColor="gray" paddingX={1}>
                        <Text color="gray">No threads yet</Text>
                    </Box>
                ) : (
                    threads.map((thread, i) => (
                        <ThreadCard
                            key={thread.id}
                            thread={thread}
                            isSelected={i === selectedIndex}
                            pane={panes.find(p => p.worktreePath === thread.path)}
                        />
                    ))
                )}
            </Box>

            {/* 힌트 바 */}
            <HintBar mode={inputMode} />

            {/* 상태 메시지 */}
            {status && (
                <Box marginTop={1}>
                    <Text color="yellow">{status}</Text>
                </Box>
            )}
        </Box>
    );
}

// 대시보드 실행
export async function runInkDashboard(config: Omit<DashboardProps, 'onQuit'>): Promise<{ action: 'quit' }> {
    return new Promise((resolve) => {
        const { unmount } = render(
            <Dashboard
                {...config}
                onQuit={() => {
                    unmount();
                    resolve({ action: 'quit' });
                }}
            />
        );
    });
}
