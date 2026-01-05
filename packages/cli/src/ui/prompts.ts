import {
    createPrompt,
    useState,
    useKeypress,
    usePrefix,
    isEnterKey,
    isBackspaceKey,
} from '@inquirer/core';
import { confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import * as path from 'path';

/**
 * ESC로 취소 가능한 커스텀 Input
 */
const cancelableInput = createPrompt<string | null, { message: string; default?: string; validate?: (value: string) => boolean | string }>(
    (config, done) => {
        const [value, setValue] = useState(config.default || '');
        const [error, setError] = useState<string | null>(null);
        const prefix = usePrefix({ status: 'idle' });

        useKeypress((key, rl) => {
            if (key.name === 'escape') {
                done(null);
            } else if (isEnterKey(key)) {
                if (config.validate) {
                    const result = config.validate(value);
                    if (result !== true) {
                        setError(typeof result === 'string' ? result : 'Invalid input');
                        return;
                    }
                }
                done(value);
            } else if (isBackspaceKey(key)) {
                setValue(value.slice(0, -1));
                setError(null);
            } else if (key.ctrl || key.name === 'tab' || key.name === 'up' || key.name === 'down') {
                // ignore control keys
            } else if (key.name && key.name.length === 1) {
                // single character
                setValue(value + key.name);
                setError(null);
            } else if (key.name === 'space') {
                setValue(value + ' ');
                setError(null);
            }
        });

        const errorMsg = error ? chalk.red(`\n${error}`) : '';
        return `${prefix} ${config.message} ${chalk.cyan(value)}${errorMsg}\n${chalk.dim('ESC:cancel Enter:confirm')}`;
    }
);

/**
 * 경로를 터미널 폭에 맞게 축약
 */
function truncatePath(fullPath: string, maxLen: number): string {
    if (fullPath.length <= maxLen) return fullPath;

    const home = process.env.HOME || '';
    let display = fullPath.startsWith(home)
        ? '~' + fullPath.slice(home.length)
        : fullPath;

    if (display.length <= maxLen) return display;

    const parts = display.split(path.sep);
    if (parts.length > 2) {
        return '…/' + parts.slice(-2).join('/');
    }
    return '…' + display.slice(-maxLen + 1);
}

// 스레드 타입
export interface Thread {
    type: 'worktree' | 'local';
    name: string;
    path: string;
    branch?: string;
    id?: string;
}

export interface ThreadChoice {
    type: 'existing' | 'new' | 'exit' | 'delete-selected';
    thread?: Thread;
}

export type ThreadAction = 'open' | 'delete' | 'back';
export type NewThreadType = 'worktree' | 'local' | 'back';

interface SelectChoice<T> {
    name: string;
    value: T;
    disabled?: boolean;
}

/**
 * 커스텀 Select (vim 키바인딩)
 */
const vimSelect = createPrompt(
    <T>(
        config: {
            message: string;
            choices: SelectChoice<T>[];
            pageSize?: number;
            shortcuts?: { key: string; value: T; description?: string }[];
        },
        done: (value: T) => void
    ) => {
        const { choices, pageSize = 15, shortcuts = [] } = config;
        const enabledChoices = choices.filter((c) => !c.disabled);
        const [selectedIndex, setSelectedIndex] = useState(0);
        const prefix = usePrefix({ status: 'idle' });

        useKeypress((key) => {
            // vim navigation
            if (key.name === 'j' || key.name === 'down') {
                const nextIndex = (selectedIndex + 1) % enabledChoices.length;
                setSelectedIndex(nextIndex);
            } else if (key.name === 'k' || key.name === 'up') {
                const prevIndex =
                    (selectedIndex - 1 + enabledChoices.length) %
                    enabledChoices.length;
                setSelectedIndex(prevIndex);
            } else if (isEnterKey(key)) {
                done(enabledChoices[selectedIndex].value);
            } else if (key.name === 'escape' || key.name === 'b') {
                // 뒤로가기 (shortcuts에 back이 있으면)
                const backShortcut = shortcuts.find((s) => s.key === 'back');
                if (backShortcut) {
                    done(backShortcut.value);
                }
            } else {
                // 커스텀 단축키 체크
                const shortcut = shortcuts.find((s) => s.key === key.name);
                if (shortcut) {
                    done(shortcut.value);
                }
            }
        });

        // 페이지네이션 계산
        const totalItems = enabledChoices.length;
        const halfPage = Math.floor(pageSize / 2);
        let startIndex = 0;

        if (totalItems > pageSize) {
            if (selectedIndex <= halfPage) {
                startIndex = 0;
            } else if (selectedIndex >= totalItems - halfPage) {
                startIndex = totalItems - pageSize;
            } else {
                startIndex = selectedIndex - halfPage;
            }
        }

        const visibleChoices = enabledChoices.slice(
            startIndex,
            startIndex + pageSize
        );

        // 렌더링
        const lines = visibleChoices.map((choice, i) => {
            const actualIndex = startIndex + i;
            const isSelected = actualIndex === selectedIndex;
            const cursor = isSelected ? chalk.cyan('❯') : ' ';
            const name = isSelected ? chalk.cyan(choice.name) : choice.name;
            return `${cursor} ${name}`;
        });

        // 스크롤 인디케이터
        if (startIndex > 0) {
            lines.unshift(chalk.dim('  ↑ more'));
        }
        if (startIndex + pageSize < totalItems) {
            lines.push(chalk.dim('  ↓ more'));
        }

        // 단축키 힌트
        const shortcutHints = shortcuts
            .filter((s) => s.description)
            .map((s) => chalk.dim(`${s.key}:${s.description}`))
            .join(' ');

        const hint = chalk.dim('j/k:navigate enter:select') + (shortcutHints ? ' ' + shortcutHints : '');

        return `${prefix} ${chalk.bold(config.message)}\n${lines.join('\n')}\n${hint}`;
    }
);

/**
 * 메인 스레드 선택 UI (d키로 삭제 지원)
 */
export async function selectThread(
    threads: Thread[],
    repoName: string
): Promise<ThreadChoice> {
    const cols = process.stdout.columns || 80;
    const nameWidth = 18;
    const prefixWidth = 6;
    const pathMaxLen = Math.max(20, cols - nameWidth - prefixWidth - 5);

    // 스레드 + 새 작업 옵션
    const threadChoices = threads.map((t) => {
        const typeIcon =
            t.type === 'worktree' ? chalk.cyan('[W]') : chalk.yellow('[L]');
        const displayPath = truncatePath(t.path, pathMaxLen);
        return {
            name: `${typeIcon} ${t.name.padEnd(nameWidth)} ${chalk.dim(displayPath)}`,
            value: { type: 'existing' as const, thread: t },
            thread: t,
        };
    });

    const newChoice = {
        name: chalk.green('+ 새 작업'),
        value: { type: 'new' as const },
        thread: null as Thread | null,
    };

    const allChoices = [...threadChoices, newChoice];

    // 커스텀 프롬프트로 'd' 키 지원
    const threadSelect = createPrompt(
        (
            config: { message: string },
            done: (value: ThreadChoice) => void
        ) => {
            const [selectedIndex, setSelectedIndex] = useState(0);
            const prefix = usePrefix({ status: 'idle' });
            const pageSize = 15;

            useKeypress((key) => {
                if (key.name === 'j' || key.name === 'down') {
                    setSelectedIndex((selectedIndex + 1) % allChoices.length);
                } else if (key.name === 'k' || key.name === 'up') {
                    setSelectedIndex(
                        (selectedIndex - 1 + allChoices.length) % allChoices.length
                    );
                } else if (isEnterKey(key)) {
                    done(allChoices[selectedIndex].value);
                } else if (key.name === 'n') {
                    done({ type: 'new' });
                } else if (key.name === 'q') {
                    done({ type: 'exit' });
                } else if (key.name === 'd') {
                    // d키: 현재 선택된 것이 스레드면 삭제 흐름
                    const current = allChoices[selectedIndex];
                    if (current.thread) {
                        done({ type: 'delete-selected', thread: current.thread });
                    }
                }
            });

            // 페이지네이션
            const totalItems = allChoices.length;
            const halfPage = Math.floor(pageSize / 2);
            let startIndex = 0;

            if (totalItems > pageSize) {
                if (selectedIndex <= halfPage) {
                    startIndex = 0;
                } else if (selectedIndex >= totalItems - halfPage) {
                    startIndex = totalItems - pageSize;
                } else {
                    startIndex = selectedIndex - halfPage;
                }
            }

            const visibleChoices = allChoices.slice(startIndex, startIndex + pageSize);

            const lines = visibleChoices.map((choice, i) => {
                const actualIndex = startIndex + i;
                const isSelected = actualIndex === selectedIndex;
                const cursor = isSelected ? chalk.cyan('❯') : ' ';
                const name = isSelected ? chalk.cyan(choice.name) : choice.name;
                return `${cursor} ${name}`;
            });

            if (startIndex > 0) {
                lines.unshift(chalk.dim('  ↑ more'));
            }
            if (startIndex + pageSize < totalItems) {
                lines.push(chalk.dim('  ↓ more'));
            }

            const hint = chalk.dim('j/k:nav n:new d:delete q:quit');

            return `${prefix} ${config.message}\n${lines.join('\n')}\n${hint}`;
        }
    );

    return threadSelect({ message: chalk.bold(repoName) });
}

/**
 * 스레드 액션 선택 (열기/삭제)
 */
export async function selectThreadAction(
    threadName: string
): Promise<ThreadAction> {
    const choices: SelectChoice<ThreadAction>[] = [
        { name: '터미널 열기', value: 'open' },
        { name: chalk.red('삭제하기'), value: 'delete' },
        { name: chalk.dim('← 뒤로'), value: 'back' },
    ];

    return vimSelect({
        message: `'${threadName}'`,
        choices,
        shortcuts: [{ key: 'back', value: 'back' }],
    });
}

/**
 * 새 작업 타입 선택 (워크트리/로컬)
 */
export async function selectNewThreadType(): Promise<NewThreadType> {
    const choices: SelectChoice<NewThreadType>[] = [
        {
            name:
                chalk.cyan('워크트리') +
                chalk.dim(' - 새 브랜치와 디렉토리 생성'),
            value: 'worktree',
        },
        {
            name: chalk.yellow('로컬') + chalk.dim(' - 현재 디렉토리에서 작업'),
            value: 'local',
        },
        { name: chalk.dim('← 뒤로'), value: 'back' },
    ];

    return vimSelect({
        message: '새 작업 타입',
        choices,
        shortcuts: [{ key: 'back', value: 'back' }],
    });
}

/**
 * 새 워크트리 생성 폼
 */
export async function newWorktreeForm(defaultBasePath: string): Promise<{
    name: string;
    path: string;
} | null> {
    const name = await cancelableInput({
        message: '워크트리 이름:',
        validate: (value) => {
            if (!value.trim()) return '이름을 입력해주세요';
            if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
                return '영문, 숫자, -, _ 만 사용 가능';
            }
            return true;
        },
    });

    if (!name) return null;

    const defaultPath = `${defaultBasePath}/${name}`;
    const pathInput = await cancelableInput({
        message: '경로:',
        default: defaultPath,
    });

    if (!pathInput) return null;

    return { name, path: pathInput };
}

/**
 * 새 로컬 스레드 이름 입력
 */
export async function newLocalForm(): Promise<string | null> {
    const name = await cancelableInput({
        message: '로컬 스레드 이름:',
        validate: (value) => {
            if (!value.trim()) return '이름을 입력해주세요';
            return true;
        },
    });

    return name || null;
}

/**
 * 워크트리 삭제 확인
 */
export async function confirmDeleteWorktree(threadName: string): Promise<{
    confirmed: boolean;
    removeGitWorktree: boolean;
}> {
    const confirmed = await confirm({
        message: `'${threadName}' 워크트리를 삭제할까요?`,
        default: true,
    });

    if (!confirmed) {
        return { confirmed: false, removeGitWorktree: false };
    }

    const removeGitWorktree = await confirm({
        message: 'Git worktree와 브랜치도 함께 삭제할까요?',
        default: true,
    });

    return { confirmed, removeGitWorktree };
}

/**
 * 로컬 스레드 삭제 확인
 */
export async function confirmDeleteLocal(threadName: string): Promise<boolean> {
    return await confirm({
        message: `'${threadName}' 로컬 스레드를 삭제할까요?`,
        default: true,
    });
}
