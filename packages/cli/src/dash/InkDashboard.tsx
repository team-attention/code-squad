import React, { useState, useEffect, useCallback } from 'react';
import { render, Box, Text, useInput, useApp, useStdin } from 'ink';
import TextInput from 'ink-text-input';
import type { ThreadInfo, IsolationMode } from './types.js';
import { TmuxAdapter } from './TmuxAdapter.js';
import { loadAllThreads, createThread, deleteThread } from './threadHelpers.js';

// 대시보드 pane 고정 너비
const DASHBOARD_WIDTH = 35;

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
    currentBranch: string;
    initialThreads: ThreadInfo[];
    tmuxAdapter: TmuxAdapter;
    dashPaneId: string;
    initialTerminalPaneId: string;
    onQuit: () => void;
}

// 스레드 카드 컴포넌트
function ThreadCard({
    thread,
    isSelected,
    isVisible,
    hasPaneOpen,
}: {
    thread: ThreadInfo;
    isSelected: boolean;
    isVisible: boolean;
    hasPaneOpen: boolean;
}) {
    const borderColor = isSelected ? 'cyan' : 'gray';
    const nameColor = isSelected ? 'cyan' : 'white';

    // isVisible: 현재 보이는 pane, hasPaneOpen: pane이 존재하지만 숨겨진 상태
    const statusIcon = isVisible ? '●' : hasPaneOpen ? '○' : '○';
    const statusColor = isVisible ? 'green' : hasPaneOpen ? 'blue' : 'gray';

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
            <Text color="gray">↑↓/jk: nav  Enter: switch  r: refresh  q: quit</Text>
        </Box>
    );
}

// 메인 대시보드 컴포넌트
function Dashboard({
    workspaceRoot,
    repoName,
    currentBranch,
    initialThreads,
    tmuxAdapter,
    dashPaneId,
    initialTerminalPaneId,
    onQuit,
}: DashboardProps) {
    const { exit } = useApp();

    const [threads, setThreads] = useState<ThreadInfo[]>(initialThreads);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [inputMode, setInputMode] = useState<InputMode>('normal');
    const [newThreadName, setNewThreadName] = useState('');
    const [isolationMode, setIsolationMode] = useState<IsolationMode>('worktree');
    const [status, setStatus] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // 현재 보이는 pane 정보
    const [visiblePaneId, setVisiblePaneId] = useState<string>(initialTerminalPaneId);
    const [visiblePaneKey, setVisiblePaneKey] = useState<string>('__initial__');

    // 숨겨진 pane들: key → hidden window ID
    const [hiddenWindows, setHiddenWindows] = useState<Map<string, string>>(new Map());

    // 스레드 목록 새로고침
    const refreshThreads = useCallback(async () => {
        const updatedThreads = await loadAllThreads(workspaceRoot);
        setThreads(updatedThreads);
        return { threads: updatedThreads };
    }, [workspaceRoot]);

    // 화면 새로고침 (잔상 제거 + 리렌더)
    const hardRedraw = useCallback(() => {
        process.stdout.write('\x1b[2J\x1b[H\x1b[3J');
        void tmuxAdapter.refreshClient();
        setTimeout(() => {
            process.stdout.emit('resize');
        }, 140);
    }, [tmuxAdapter]);

    const getRightPaneId = useCallback(async (): Promise<string> => {
        const panes = await tmuxAdapter.listPanes();
        const rightPane = panes.find(p => p.id !== dashPaneId);
        return rightPane?.id ?? visiblePaneId;
    }, [tmuxAdapter, dashPaneId, visiblePaneId]);

    // 대시보드 크기 복원 + 레이아웃 고정
    const restoreDashboardSize = useCallback(async () => {
        const windowWidth = await tmuxAdapter.getWindowWidth();
        const rightPaneId = await getRightPaneId();
        const rightWidth = Math.max(10, windowWidth - DASHBOARD_WIDTH - 1);
        await tmuxAdapter.setPaneWidth(dashPaneId, DASHBOARD_WIDTH);
        if (rightPaneId && rightPaneId !== dashPaneId) {
            await tmuxAdapter.setPaneWidth(rightPaneId, rightWidth);
        }
    }, [tmuxAdapter, dashPaneId, getRightPaneId]);

    const stabilizeLayout = useCallback(() => {
        void restoreDashboardSize();
        setTimeout(() => {
            void restoreDashboardSize();
        }, 140);
    }, [restoreDashboardSize]);

    // 초기 레이아웃 안정화 (마운트 시 한 번 실행)
    useEffect(() => {
        void restoreDashboardSize();
    }, [restoreDashboardSize]);

    // pane 전환 함수 (swap-pane 방식)
    const switchToPane = useCallback(async (targetKey: string, targetWindowId: string) => {
        if (targetKey === visiblePaneKey) {
            await tmuxAdapter.selectPane(visiblePaneId);
            return;
        }

        const currentRightWidth = await tmuxAdapter.getPaneWidth(visiblePaneId);
        await tmuxAdapter.setWindowPaneWidth(targetWindowId, currentRightWidth);

        // swap 전 레이아웃 안정화
        await restoreDashboardSize();

        // target window의 pane과 현재 오른쪽 pane을 swap
        await tmuxAdapter.swapPaneWithWindow(targetWindowId, visiblePaneId);
        await restoreDashboardSize();
        setHiddenWindows(prev => {
            const newMap = new Map(prev);
            newMap.delete(targetKey); // target은 이제 visible
            newMap.set(visiblePaneKey, targetWindowId); // 기존 visible은 hidden으로 이동
            return newMap;
        });

        setVisiblePaneId(await getRightPaneId());
        setVisiblePaneKey(targetKey);

        // 대시보드 리렌더
        hardRedraw();
        stabilizeLayout();
    }, [visiblePaneId, visiblePaneKey, tmuxAdapter, restoreDashboardSize, getRightPaneId, hardRedraw, stabilizeLayout]);

    // 터미널 pane 열기/포커스
    const openOrFocusPane = useCallback(async (thread: ThreadInfo) => {
        // 이미 보이는 pane이면 포커스만
        if (thread.id === visiblePaneKey) {
            await tmuxAdapter.selectPane(visiblePaneId);
            setStatus(`Focused: ${thread.name}`);
            return;
        }

        // 숨겨진 window가 있으면 전환
        const existingWindowId = hiddenWindows.get(thread.id);
        if (existingWindowId) {
            await switchToPane(thread.id, existingWindowId);
            setStatus(`Switched: ${thread.name}`);
            return;
        }

        // 새 window 생성 후 swap으로 전환
        setStatus(`Opening ${thread.name}...`);
        const newWindowId = await tmuxAdapter.createHiddenWindow(thread.path);
        const currentRightWidth = await tmuxAdapter.getPaneWidth(visiblePaneId);
        await tmuxAdapter.setWindowPaneWidth(newWindowId, currentRightWidth);
        await switchToPane(thread.id, newWindowId);
        setStatus(`Opened: ${thread.name}`);
    }, [visiblePaneId, visiblePaneKey, hiddenWindows, tmuxAdapter, switchToPane]);

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
            // 화면 클리어 + 전체 리렌더
            process.stdout.write('\x1b[2J\x1b[H');
            process.stdout.emit('resize');
            await refreshThreads();
            setStatus('Refreshed');
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

            // 새 window 생성 (기존 스레드 열기와 동일한 방식)
            const newWindowId = await tmuxAdapter.createHiddenWindow(newThread.path);
            const currentRightWidth = await tmuxAdapter.getPaneWidth(visiblePaneId);
            await tmuxAdapter.setWindowPaneWidth(newWindowId, currentRightWidth);

            // switchToPane으로 전환 (기존 스레드 포커스와 동일)
            await switchToPane(newThread.id, newWindowId);

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
            // 삭제할 스레드가 현재 보이는 pane인 경우
            if (selected.id === visiblePaneKey) {
                // 다른 곳으로 전환
                const otherKey = hiddenWindows.has('__initial__')
                    ? '__initial__'
                    : Array.from(hiddenWindows.keys()).find(k => k !== selected.id);

                if (otherKey) {
                    const otherWindowId = hiddenWindows.get(otherKey);
                    if (otherWindowId) {
                        await switchToPane(otherKey, otherWindowId);
                    }
                }

                // 이제 숨겨진 window로 이동한 삭제 대상 종료
                const hiddenWindowId = hiddenWindows.get(selected.id);
                if (hiddenWindowId) {
                    await tmuxAdapter.killWindow(hiddenWindowId);
                    setHiddenWindows(prev => {
                        const newMap = new Map(prev);
                        newMap.delete(selected.id);
                        return newMap;
                    });
                }
            } else {
                // 숨겨진 window에 있는 경우
                const hiddenWindowId = hiddenWindows.get(selected.id);
                if (hiddenWindowId) {
                    await tmuxAdapter.killWindow(hiddenWindowId);
                    setHiddenWindows(prev => {
                        const newMap = new Map(prev);
                        newMap.delete(selected.id);
                        return newMap;
                    });
                }
            }

            await deleteThread(workspaceRoot, selected);

            const { threads: updatedThreads } = await refreshThreads();
            setSelectedIndex(Math.min(selectedIndex, Math.max(0, updatedThreads.length - 1)));

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
                <Text color="cyan"> [{currentBranch}]</Text>
                <Text color="gray"> ({threads.length})</Text>
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
                    threads.map((thread, i) => {
                        const isVisible = thread.id === visiblePaneKey;
                        const hasPaneOpen = isVisible || hiddenWindows.has(thread.id);
                        return (
                            <ThreadCard
                                key={thread.id}
                                thread={thread}
                                isSelected={i === selectedIndex}
                                isVisible={isVisible}
                                hasPaneOpen={hasPaneOpen}
                            />
                        );
                    })
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
