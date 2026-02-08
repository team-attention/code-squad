import React, { useState, useEffect, useCallback, useRef } from 'react';
import { render, Box, Text, useInput, useStdin } from 'ink';
import TextInput from 'ink-text-input';
import type { TmuxWindowInfo } from './types.js';
import { TmuxAdapter } from './TmuxAdapter.js';
import { loadAllWindows, deleteWindowById } from './windowHelpers.js';
import { createThread, deleteThread } from './threadHelpers.js';
import { expandTilde } from './pathUtils.js';
import { useDirectorySuggestions } from './useDirectorySuggestions.js';
import { usePathValidation } from './usePathValidation.js';

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
    const { stdin } = useStdin();

    useEffect(() => {
        if (!enabled) {
            process.stdout.write('\x1b[?1006l');
            process.stdout.write('\x1b[?1000l');
            return;
        }

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
type InputMode = 'normal' | 'new-window' | 'confirm-delete';

interface DashboardProps {
    workspaceRoot: string;
    repoName: string;
    currentBranch: string;
    initialWindows: TmuxWindowInfo[];
    tmuxAdapter: TmuxAdapter;
    dashWindowIndex: number;
    paneHeight: number;
}

// Window 카드 컴포넌트
function WindowCard({
    window,
    isSelected,
}: {
    window: TmuxWindowInfo;
    isSelected: boolean;
}) {
    const borderColor = isSelected ? 'cyan' : 'gray';
    const nameColor = isSelected ? 'cyan' : 'white';

    const statusIcon = window.isActive ? '●' : '○';
    const statusColor = window.isActive ? 'green' : 'gray';

    const projectName = window.projectRoot
        ? window.projectRoot.split('/').slice(-1)[0]
        : window.cwd.split('/').slice(-1)[0];

    const threadName = window.worktreeBranch ?? window.name;

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
                <Text color={nameColor} bold={isSelected}>{window.name}</Text>
                {isSelected && <Text color="red"> ✕</Text>}
            </Box>
            <Box>
                <Text color="gray">{projectName}</Text>
                <Text color="gray"> → </Text>
                <Text color="cyan">{threadName}</Text>
            </Box>
        </Box>
    );
}

// 포커스 필드 타입
type FocusField = 'name' | 'root';

// 새 Window 폼 컴포넌트
function NewWindowForm({
    windowName,
    onWindowNameChange,
    rootPath,
    onRootPathChange,
    validation,
    onSubmit,
    onCancel,
}: {
    windowName: string;
    onWindowNameChange: (value: string) => void;
    rootPath: string;
    onRootPathChange: (value: string) => void;
    validation: { status: 'valid' | 'creatable' | 'invalid'; isGitRepo: boolean } | null;
    onSubmit: () => void;
    onCancel: () => void;
}) {
    const [focusedField, setFocusedField] = useState<FocusField>('name');
    const dirSuggestions = useDirectorySuggestions();

    useInput(async (input, key) => {
        if (key.escape) {
            if (dirSuggestions.isOpen) {
                dirSuggestions.clearSuggestions();
            } else {
                onCancel();
            }
            return;
        }

        if (key.return) {
            if (dirSuggestions.isOpen) {
                const accepted = dirSuggestions.acceptSelected(rootPath);
                if (accepted) onRootPathChange(accepted);
            } else {
                onSubmit();
            }
            return;
        }

        if (key.tab) {
            if (dirSuggestions.isOpen) {
                dirSuggestions.clearSuggestions();
            }
            setFocusedField(prev => prev === 'name' ? 'root' : 'name');
            return;
        }

        if (key.upArrow) {
            if (dirSuggestions.isOpen) {
                dirSuggestions.selectPrev();
            } else {
                setFocusedField('name');
            }
            return;
        }

        if (key.downArrow) {
            if (dirSuggestions.isOpen) {
                dirSuggestions.selectNext();
            } else {
                setFocusedField('root');
            }
            return;
        }

    });

    // Auto-trigger suggestions as user types
    const handleRootPathChange = useCallback(async (value: string) => {
        onRootPathChange(value);
        if (value.endsWith('/')) {
            const completed = await dirSuggestions.triggerComplete(value);
            if (completed) onRootPathChange(completed);
        } else if (value.length > 1 && value.includes('/')) {
            await dirSuggestions.triggerComplete(value);
        } else {
            dirSuggestions.clearSuggestions();
        }
    }, [dirSuggestions, onRootPathChange]);

    // Validation indicator
    let validationIcon = '';
    let validationColor: string | undefined;
    let validationText = '';
    if (validation) {
        if (validation.status === 'valid') {
            if (validation.isGitRepo) {
                validationIcon = '✓';
                validationColor = 'green';
                validationText = 'git repo';
            } else {
                validationIcon = '✗';
                validationColor = 'red';
                validationText = 'not a git repo';
            }
        } else if (validation.status === 'creatable') {
            validationIcon = '✗';
            validationColor = 'red';
            validationText = 'not a git repo';
        } else {
            validationIcon = '✗';
            validationColor = 'red';
            validationText = 'invalid path';
        }
    }

    return (
        <Box
            flexDirection="column"
            borderStyle="round"
            borderColor="yellow"
            paddingX={1}
        >
            <Text color="yellow" bold>+ New Window</Text>
            <Box marginTop={1}>
                <Text color={focusedField === 'name' ? 'cyan' : undefined}>Name: </Text>
                <TextInput
                    value={windowName}
                    onChange={focusedField === 'name' ? onWindowNameChange : () => {}}
                    placeholder="window-name"
                    focus={focusedField === 'name'}
                />
            </Box>
            <Box marginTop={1}>
                <Text color={focusedField === 'root' ? 'cyan' : 'gray'}>Root: </Text>
                {focusedField === 'root' ? (
                    <TextInput
                        value={rootPath}
                        onChange={handleRootPathChange}
                        placeholder="/path/to/dir"
                        focus={true}
                    />
                ) : (
                    <Text color="gray">{rootPath}</Text>
                )}
            </Box>

            {/* Validation indicator */}
            {validation && (
                <Box>
                    <Text>  </Text>
                    <Text color={validationColor}>{validationIcon} {validationText}</Text>
                </Box>
            )}

            {/* Autocomplete suggestions */}
            {dirSuggestions.isOpen && dirSuggestions.visibleSuggestions.length > 0 && (
                <Box flexDirection="column">
                    {dirSuggestions.visibleSuggestions.map((s) => (
                        <Box key={s.name}>
                            <Text color={s.isSelected ? 'cyan' : 'gray'}>
                                {s.isSelected ? ' > ' : '   '}
                                {s.name}/
                            </Text>
                        </Box>
                    ))}
                    {dirSuggestions.hasMore && (
                        <Text color="gray">   ↑↓ for more</Text>
                    )}
                </Box>
            )}

            {/* Hint bar */}
            {dirSuggestions.isOpen ? (
                <Box marginTop={1}>
                    <Text color="gray">↑↓:select Enter:pick Esc:close</Text>
                </Box>
            ) : (
                <Box marginTop={1}>
                    <Text color="gray">Tab:field Enter:ok Esc:cancel</Text>
                </Box>
            )}
        </Box>
    );
}

// 삭제 확인 컴포넌트
function DeleteConfirm({
    windowName,
    onConfirm,
    onCancel,
}: {
    windowName: string;
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
            <Text color="red">Delete "{windowName}"? </Text>
            <Text color="gray">(y/n)</Text>
        </Box>
    );
}

// 힌트 바 컴포넌트
function HintBar({ mode }: { mode: InputMode }) {
    if (mode === 'new-window') {
        return null;
    }

    return (
        <Box marginTop={1}>
            <Text color="gray">↑↓/jk: nav  Enter: switch  r: refresh  q: detach</Text>
        </Box>
    );
}

// 메인 대시보드 컴포넌트
function Dashboard({
    workspaceRoot,
    repoName,
    currentBranch,
    initialWindows,
    tmuxAdapter,
    dashWindowIndex,
    paneHeight,
}: DashboardProps) {

    const [windows, setWindows] = useState<TmuxWindowInfo[]>(initialWindows);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [inputMode, setInputMode] = useState<InputMode>('normal');
    const [newWindowName, setNewWindowName] = useState('');
    const [rootPath, setRootPath] = useState(workspaceRoot);

    // Dynamic git repo detection from path validation
    const { validation, isGitRepo: formIsGitRepo } = usePathValidation(rootPath);

    // name 변경 핸들러 (공백 제거)
    const handleWindowNameChange = useCallback((value: string) => {
        const sanitized = value.replace(/\s/g, '');
        setNewWindowName(sanitized);
    }, []);
    const [status, setStatus] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    // Track which window's content is currently shown in the right pane
    const activeWindowIdRef = useRef<string | null>(null);
    const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Auto-clear status message after 2 seconds
    const showStatus = useCallback((msg: string) => {
        if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
        setStatus(msg);
        statusTimerRef.current = setTimeout(() => setStatus(''), 2000);
    }, []);

    // Window 목록 새로고침
    const refreshWindows = useCallback(async () => {
        const updatedWindows = await loadAllWindows(tmuxAdapter, dashWindowIndex);
        setWindows(updatedWindows);
        return { windows: updatedWindows };
    }, [tmuxAdapter, dashWindowIndex]);

    // Auto-select first thread on restore (mount)
    useEffect(() => {
        if (initialWindows.length === 0) return;
        const first = initialWindows[0];
        if (first) {
            void handleSelectWindow(first);
        }
    }, []);

    // 레이아웃 행 계산 (마우스 클릭 매핑용)
    const HEADER_ROWS = 3;
    const NEW_WINDOW_ROWS = 3;
    const WINDOW_START_ROW = HEADER_ROWS + NEW_WINDOW_ROWS + 2;
    const WINDOW_HEIGHT = 4;

    // 마우스 클릭 핸들러
    const handleMouseClick = useCallback((row: number, col: number) => {
        if (isProcessing || inputMode !== 'normal') return;

        // 새 Window 버튼 클릭
        if (row >= HEADER_ROWS + 1 && row <= HEADER_ROWS + NEW_WINDOW_ROWS + 1) {
            setInputMode('new-window');
            setNewWindowName('');
            setRootPath(workspaceRoot);
            return;
        }

        // Window 리스트 클릭
        if (row >= WINDOW_START_ROW && windows.length > 0) {
            const windowIndex = Math.floor((row - WINDOW_START_ROW) / WINDOW_HEIGHT);
            if (windowIndex >= 0 && windowIndex < windows.length) {
                setSelectedIndex(windowIndex);
                // 클릭하면 바로 전환
                void handleSelectWindow(windows[windowIndex]);
            }
        }
    }, [isProcessing, inputMode, windows, workspaceRoot]);

    // 마우스 이벤트 (normal 모드에서만 활성화)
    useMouse(handleMouseClick, inputMode === 'normal');

    // 오른쪽 pane 찾기 (대시보드 pane index 0 제외)
    const findRightPane = async () => {
        const panes = await tmuxAdapter.listPanes();
        return panes.find(p => p.index !== 0);
    };

    // Window 선택 (오른쪽 pane에 swap)
    const handleSelectWindow = async (win: TmuxWindowInfo) => {
        try {
            // Already showing this window — just focus the right pane
            if (win.windowId === activeWindowIdRef.current) {
                const rightPane = await findRightPane();
                if (rightPane) await tmuxAdapter.selectPane(rightPane.id);
                return;
            }

            // Swap current right pane back to its original window
            if (activeWindowIdRef.current) {
                const rightPane = await findRightPane();
                if (rightPane) {
                    try {
                        await tmuxAdapter.swapPaneWithWindow(activeWindowIdRef.current, rightPane.id);
                    } catch {
                        // Original window may have been killed externally
                    }
                }
            }

            // Swap selected window's pane into the right position
            const rightPane = await findRightPane();
            if (rightPane) {
                await tmuxAdapter.swapPaneWithWindow(win.windowId, rightPane.id);
                activeWindowIdRef.current = win.windowId;
                await tmuxAdapter.selectPane((await findRightPane())!.id);
            }

            showStatus(`Switched: ${win.name}`);
        } catch (error) {
            showStatus(`Error: ${(error as Error).message}`);
        }
    };

    // 키보드 입력 처리 (normal 모드)
    useInput(async (input, key) => {
        // Allow Escape to cancel during processing
        if (isProcessing) {
            if (key.escape) {
                setIsProcessing(false);
                setInputMode('normal');
                showStatus('Cancelled');
            }
            return;
        }
        if (inputMode !== 'normal') return;

        if (input === 'j' || key.downArrow) {
            setSelectedIndex(prev => (prev + 1) % Math.max(windows.length, 1));
        } else if (input === 'k' || key.upArrow) {
            setSelectedIndex(prev => (prev - 1 + Math.max(windows.length, 1)) % Math.max(windows.length, 1));
        } else if (input === 'q') {
            try {
                // Swap active pane back to its original window before quitting
                if (activeWindowIdRef.current) {
                    const rightPane = await findRightPane();
                    if (rightPane) {
                        try {
                            await tmuxAdapter.swapPaneWithWindow(activeWindowIdRef.current, rightPane.id);
                        } catch {
                            // Original window may have been killed externally
                        }
                    }
                }
                // Detach + kill dashboard window in one atomic tmux command.
                // Thread windows stay alive in the detached session.
                const sessionName = `csq-${repoName}`;
                await tmuxAdapter.detachAndKillWindow(sessionName, dashWindowIndex);
            } catch {
                // Detach/kill may race, ignore
            }
        } else if (key.return) {
            const selected = windows[selectedIndex];
            if (selected) {
                await handleSelectWindow(selected);
            }
        } else if (input === 'n' || input === '+') {
            setInputMode('new-window');
            setNewWindowName('');
            setRootPath(workspaceRoot);
        } else if (input === 'd') {
            if (windows[selectedIndex]) {
                setInputMode('confirm-delete');
            }
        } else if (input === 'r') {
            process.stdout.write('\x1b[2J\x1b[H');
            process.stdout.emit('resize');
            await refreshWindows();
            showStatus('Refreshed');
        }
    });

    // 새 Window 생성
    const handleCreateWindow = async () => {
        if (!newWindowName.trim()) {
            showStatus('Window name required');
            return;
        }

        if (!validation || !formIsGitRepo) {
            showStatus('Root must be a git repo');
            return;
        }

        setIsProcessing(true);
        setStatus(`Creating ${newWindowName}...`);

        try {
            const expandedRoot = expandTilde(rootPath);

            const newThread = await createThread(workspaceRoot, newWindowName.trim(), expandedRoot);
            const newWindowId = await tmuxAdapter.createNewWindow(newThread.path, newWindowName.trim());

            const { windows: updatedWindows } = await refreshWindows();
            setInputMode('normal');
            setNewWindowName('');
            showStatus(`Created: ${newWindowName}`);

            // Auto-select the new window into the right pane
            const newWin = updatedWindows.find(w => w.windowId === newWindowId);
            if (newWin) {
                await handleSelectWindow(newWin);
            }
        } catch (error) {
            showStatus(`Error: ${(error as Error).message}`);
        }

        setIsProcessing(false);
    };

    // Window 삭제
    const handleDeleteWindow = async () => {
        const selected = windows[selectedIndex];
        if (!selected) return;

        setIsProcessing(true);
        setStatus(`Deleting ${selected.name}...`);

        try {
            // If this window's pane is currently in the right pane, swap it back first
            if (selected.windowId === activeWindowIdRef.current) {
                const rightPane = await findRightPane();
                if (rightPane) {
                    try {
                        await tmuxAdapter.swapPaneWithWindow(selected.windowId, rightPane.id);
                    } catch { /* ignore */ }
                }
                activeWindowIdRef.current = null;
            }

            // Kill the tmux window
            await deleteWindowById(tmuxAdapter, selected.windowId);

            // If it's a worktree-based window, also remove the worktree + branch
            if (selected.worktreeBranch) {
                try {
                    await deleteThread(workspaceRoot, {
                        id: selected.cwd,
                        name: selected.worktreeBranch,
                        path: selected.cwd,
                        branch: selected.worktreeBranch,
                    });
                } catch {
                    // Worktree cleanup failed — window is already deleted
                }
            }

            const { windows: updatedWindows } = await refreshWindows();
            const newIndex = Math.min(selectedIndex, Math.max(0, updatedWindows.length - 1));
            setSelectedIndex(newIndex);

            // Auto-select the previous/next window into the right pane
            const fallbackWin = updatedWindows[newIndex];
            if (fallbackWin) {
                await handleSelectWindow(fallbackWin);
            }

            setInputMode('normal');
            showStatus(`Deleted: ${selected.name}`);
        } catch (error) {
            showStatus(`Error: ${(error as Error).message}`);
            setInputMode('normal');
        }

        setIsProcessing(false);
    };

    return (
        <Box flexDirection="column" borderStyle="single" borderColor="gray" paddingX={1} height={paneHeight}>
            {/* 헤더 */}
            <Box
                borderStyle="round"
                borderColor="gray"
                paddingX={1}
                marginBottom={1}
            >
                <Text bold color="white">{repoName}</Text>
                <Text color="cyan"> [{currentBranch}]</Text>
                <Text color="gray"> ({windows.length})</Text>
            </Box>

            {/* 새 Window 폼 또는 버튼 */}
            {inputMode === 'new-window' ? (
                <NewWindowForm
                    windowName={newWindowName}
                    onWindowNameChange={handleWindowNameChange}
                    rootPath={rootPath}
                    onRootPathChange={setRootPath}
                    validation={validation}
                    onSubmit={handleCreateWindow}
                    onCancel={() => {
                        setInputMode('normal');
                        setNewWindowName('');
                    }}
                />
            ) : (
                <Box
                    borderStyle="round"
                    borderColor="gray"
                    paddingX={1}
                    marginBottom={1}
                >
                    <Text color="gray">+ New Window (press + or n)</Text>
                </Box>
            )}

            {/* 삭제 확인 */}
            {inputMode === 'confirm-delete' && windows[selectedIndex] && (
                <DeleteConfirm
                    windowName={windows[selectedIndex].name}
                    onConfirm={handleDeleteWindow}
                    onCancel={() => setInputMode('normal')}
                />
            )}

            {/* Window 리스트 */}
            <Box flexDirection="column" marginTop={1}>
                {windows.length === 0 ? (
                    <Box borderStyle="round" borderColor="gray" paddingX={1}>
                        <Text color="gray">No windows yet</Text>
                    </Box>
                ) : (
                    windows.map((win, i) => (
                        <WindowCard
                            key={win.windowId}
                            window={win}
                            isSelected={i === selectedIndex}
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
export async function runInkDashboard(config: DashboardProps): Promise<void> {
    render(<Dashboard {...config} />);
    await new Promise(() => {});
}
