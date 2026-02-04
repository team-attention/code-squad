import React, { useState, useEffect, useCallback } from 'react';
import { render, Box, Text, useInput, useStdin } from 'ink';
import TextInput from 'ink-text-input';
import type { TmuxWindowInfo, IsolationMode } from './types.js';
import { TmuxAdapter } from './TmuxAdapter.js';
import { GitAdapter } from '../adapters/GitAdapter.js';
import { loadAllWindows, filterWindowsByPath, createWindowWithOptions, deleteWindowById } from './windowHelpers.js';
import { createThread } from './threadHelpers.js';

// 대시보드 pane 고정 너비
const DASHBOARD_WIDTH = 35;

const gitAdapter = new GitAdapter();

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

// 필터 모드
type FilterMode = 'all' | 'current';

interface DashboardProps {
    workspaceRoot: string;
    repoName: string;
    currentBranch: string;
    initialWindows: TmuxWindowInfo[];
    tmuxAdapter: TmuxAdapter;
    dashWindowIndex: number;
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

    // Git repo이면 브랜치 표시, 아니면 경로 마지막 폴더 표시
    const subText = window.worktreeBranch
        ? window.worktreeBranch
        : window.cwd.split('/').slice(-1)[0];

    const typeBadge = window.isGitRepo ? 'G' : '>';
    const typeColor = window.isGitRepo ? 'green' : 'gray';

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
                <Text color={typeColor}>{typeBadge}</Text>
                <Text color="gray"> {subText}</Text>
            </Box>
        </Box>
    );
}

// 포커스 필드 타입
type FocusField = 'name' | 'path';

// 새 Window 폼 컴포넌트
function NewWindowForm({
    windowName,
    onWindowNameChange,
    startPath,
    onStartPathChange,
    isolationMode,
    onToggleMode,
    isGitRepo,
    onSubmit,
    onCancel,
}: {
    windowName: string;
    onWindowNameChange: (value: string) => void;
    startPath: string;
    onStartPathChange: (value: string) => void;
    isolationMode: IsolationMode;
    onToggleMode: () => void;
    isGitRepo: boolean;
    onSubmit: () => void;
    onCancel: () => void;
}) {
    const [focusedField, setFocusedField] = useState<FocusField>('name');

    // worktree 모드면 path 필드 이동 불가
    const canEditPath = isolationMode === 'window';

    useInput((input, key) => {
        if (key.escape) {
            onCancel();
        } else if (key.return) {
            onSubmit();
        } else if (key.tab && canEditPath) {
            setFocusedField(prev => prev === 'name' ? 'path' : 'name');
        } else if (input === ' ' && isGitRepo) {
            onToggleMode();
        }
    });

    const modeColor = isolationMode === 'worktree' ? 'green' : isolationMode === 'window' ? 'blue' : 'gray';
    const modeText = isolationMode === 'worktree' ? 'Worktree' : 'Window';

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
                <Text color={canEditPath && focusedField === 'path' ? 'cyan' : 'gray'}>Path: </Text>
                {canEditPath ? (
                    <TextInput
                        value={startPath}
                        onChange={focusedField === 'path' ? onStartPathChange : () => {}}
                        placeholder="/path/to/dir"
                        focus={focusedField === 'path'}
                    />
                ) : (
                    <Text color="gray">{startPath || `${'{workspace}'}.worktree/{name}`}</Text>
                )}
            </Box>
            {isGitRepo && (
                <Box marginTop={1}>
                    <Text>Mode: </Text>
                    <Text color={modeColor}>● {modeText}</Text>
                    <Text color="gray"> (Space to switch)</Text>
                </Box>
            )}
            <Box marginTop={1}>
                <Text color="gray">Enter: Create  Esc: Cancel</Text>
            </Box>
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
function HintBar({ mode, filterMode }: { mode: InputMode; filterMode: FilterMode }) {
    if (mode === 'new-window') {
        return (
            <Box marginTop={1}>
                <Text color="gray">Space: mode  Tab: field  Enter: create  Esc: cancel</Text>
            </Box>
        );
    }

    const filterIndicator = filterMode === 'current' ? '[F:cwd]' : '[F:all]';

    return (
        <Box marginTop={1}>
            <Text color="gray">↑↓/jk: nav  Enter: switch  f: filter  r: refresh  q: detach  </Text>
            <Text color="cyan">{filterIndicator}</Text>
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
}: DashboardProps) {

    const [windows, setWindows] = useState<TmuxWindowInfo[]>(initialWindows);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [inputMode, setInputMode] = useState<InputMode>('normal');
    const [filterMode, setFilterMode] = useState<FilterMode>('all');
    const [newWindowName, setNewWindowName] = useState('');
    const [startPath, setStartPath] = useState(workspaceRoot);
    const [isolationMode, setIsolationMode] = useState<IsolationMode>('worktree');

    // worktree 경로 계산
    const computeWorktreePath = (name: string) => `${workspaceRoot}.worktree/${name}`;

    // name 변경 핸들러 (공백 제거 + worktree 모드면 path 자동 업데이트)
    const handleWindowNameChange = (value: string) => {
        const sanitized = value.replace(/\s/g, '');
        setNewWindowName(sanitized);
        if (isolationMode === 'worktree' && sanitized) {
            setStartPath(computeWorktreePath(sanitized));
        } else if (isolationMode === 'worktree' && !sanitized) {
            setStartPath(workspaceRoot);
        }
    };

    // 모드 전환 핸들러
    const handleToggleMode = () => {
        const newMode = isolationMode === 'worktree' ? 'window' : 'worktree';
        setIsolationMode(newMode);
        if (newMode === 'worktree' && newWindowName) {
            setStartPath(computeWorktreePath(newWindowName));
        } else if (newMode === 'window') {
            setStartPath(workspaceRoot);
        }
    };
    const [isGitRepo, setIsGitRepo] = useState(!!currentBranch);
    const [status, setStatus] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // 필터링된 window 목록
    const displayedWindows = filterMode === 'current'
        ? filterWindowsByPath(windows, workspaceRoot)
        : windows;

    // Window 목록 새로고침
    const refreshWindows = useCallback(async () => {
        const updatedWindows = await loadAllWindows(tmuxAdapter, dashWindowIndex);
        setWindows(updatedWindows);
        return { windows: updatedWindows };
    }, [tmuxAdapter, dashWindowIndex]);

    // workspaceRoot가 Git repo인지 확인 (currentBranch 없을 때만)
    useEffect(() => {
        // currentBranch가 있으면 이미 git repo
        if (currentBranch) return;

        const checkGitRepo = async () => {
            const isGit = await gitAdapter.isGitRepository(workspaceRoot);
            setIsGitRepo(isGit);
            if (!isGit) {
                setIsolationMode('window');
            }
        };
        void checkGitRepo();
    }, [workspaceRoot, currentBranch]);

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
            setStartPath(workspaceRoot);
            return;
        }

        // Window 리스트 클릭
        if (row >= WINDOW_START_ROW && displayedWindows.length > 0) {
            const windowIndex = Math.floor((row - WINDOW_START_ROW) / WINDOW_HEIGHT);
            if (windowIndex >= 0 && windowIndex < displayedWindows.length) {
                setSelectedIndex(windowIndex);
                // 클릭하면 바로 전환
                void handleSelectWindow(displayedWindows[windowIndex]);
            }
        }
    }, [isProcessing, inputMode, displayedWindows, workspaceRoot]);

    // 마우스 이벤트 (normal 모드에서만 활성화)
    useMouse(handleMouseClick, inputMode === 'normal');

    // Window 선택 (포커스 전환)
    const handleSelectWindow = async (win: TmuxWindowInfo) => {
        try {
            await tmuxAdapter.selectWindow(win.windowId);
            setStatus(`Switched: ${win.name}`);
        } catch (error) {
            setStatus(`Error: ${(error as Error).message}`);
        }
    };

    // 키보드 입력 처리 (normal 모드)
    useInput(async (input, key) => {
        if (isProcessing) return;
        if (inputMode !== 'normal') return;

        if (input === 'j' || key.downArrow) {
            setSelectedIndex(prev => (prev + 1) % Math.max(displayedWindows.length, 1));
        } else if (input === 'k' || key.upArrow) {
            setSelectedIndex(prev => (prev - 1 + Math.max(displayedWindows.length, 1)) % Math.max(displayedWindows.length, 1));
        } else if (input === 'q') {
            try {
                await tmuxAdapter.detachClient();
            } catch (error) {
                setStatus('Failed to detach: ' + (error as Error).message);
            }
        } else if (key.return) {
            const selected = displayedWindows[selectedIndex];
            if (selected) {
                await handleSelectWindow(selected);
            }
        } else if (input === 'n' || input === '+') {
            setInputMode('new-window');
            setNewWindowName('');
            setStartPath(workspaceRoot);
        } else if (input === 'd') {
            if (displayedWindows[selectedIndex]) {
                setInputMode('confirm-delete');
            }
        } else if (input === 'f') {
            // 필터 모드 토글
            setFilterMode(prev => prev === 'all' ? 'current' : 'all');
            setSelectedIndex(0);
            setStatus(filterMode === 'all' ? 'Filter: current directory' : 'Filter: all windows');
        } else if (input === 'r') {
            process.stdout.write('\x1b[2J\x1b[H');
            process.stdout.emit('resize');
            await refreshWindows();
            setStatus('Refreshed');
        }
    });

    // 새 Window 생성
    const handleCreateWindow = async () => {
        if (!newWindowName.trim()) {
            setStatus('Window name required');
            return;
        }

        setIsProcessing(true);
        setStatus(`Creating ${newWindowName}...`);

        try {
            if (isolationMode === 'worktree' && isGitRepo) {
                // Worktree 모드: worktree 생성 후 해당 경로에서 window 열기
                const newThread = await createThread(startPath, newWindowName.trim(), 'worktree');
                await tmuxAdapter.createNewWindow(newThread.path, newWindowName.trim());
            } else {
                // 일반 window 모드
                await createWindowWithOptions(tmuxAdapter, startPath, newWindowName.trim());
            }

            await refreshWindows();
            setInputMode('normal');
            setNewWindowName('');
            setStatus(`Created: ${newWindowName}`);
        } catch (error) {
            setStatus(`Error: ${(error as Error).message}`);
        }

        setIsProcessing(false);
    };

    // Window 삭제
    const handleDeleteWindow = async () => {
        const selected = displayedWindows[selectedIndex];
        if (!selected) return;

        setIsProcessing(true);
        setStatus(`Deleting ${selected.name}...`);

        try {
            await deleteWindowById(tmuxAdapter, selected.windowId);

            const { windows: updatedWindows } = await refreshWindows();
            const filteredUpdated = filterMode === 'current'
                ? filterWindowsByPath(updatedWindows, workspaceRoot)
                : updatedWindows;
            const newIndex = Math.min(selectedIndex, Math.max(0, filteredUpdated.length - 1));
            setSelectedIndex(newIndex);

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
                <Text color="gray"> ({displayedWindows.length})</Text>
            </Box>

            {/* 새 Window 폼 또는 버튼 */}
            {inputMode === 'new-window' ? (
                <NewWindowForm
                    windowName={newWindowName}
                    onWindowNameChange={handleWindowNameChange}
                    startPath={startPath}
                    onStartPathChange={setStartPath}
                    isolationMode={isolationMode}
                    onToggleMode={handleToggleMode}
                    isGitRepo={isGitRepo}
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
            {inputMode === 'confirm-delete' && displayedWindows[selectedIndex] && (
                <DeleteConfirm
                    windowName={displayedWindows[selectedIndex].name}
                    onConfirm={handleDeleteWindow}
                    onCancel={() => setInputMode('normal')}
                />
            )}

            {/* Window 리스트 */}
            <Box flexDirection="column" marginTop={1}>
                {displayedWindows.length === 0 ? (
                    <Box borderStyle="round" borderColor="gray" paddingX={1}>
                        <Text color="gray">No windows yet</Text>
                    </Box>
                ) : (
                    displayedWindows.map((win, i) => (
                        <WindowCard
                            key={win.windowId}
                            window={win}
                            isSelected={i === selectedIndex}
                        />
                    ))
                )}
            </Box>

            {/* 힌트 바 */}
            <HintBar mode={inputMode} filterMode={filterMode} />

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
