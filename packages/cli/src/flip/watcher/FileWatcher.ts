import chokidar, { FSWatcher } from 'chokidar';
import * as path from 'path';
import { FILTERED_PATTERNS } from '../constants/filters.js';

export interface FileWatcherOptions {
    cwd: string;
    debounceMs?: number;
}

type EventCallback = () => void;
type FileEventCallback = (filePath: string) => void;

export class FileWatcher {
    private watcher: FSWatcher | null = null;
    private cwd: string;
    private debounceMs: number;

    private filesChangedCallbacks: EventCallback[] = [];
    private fileChangedCallbacks: FileEventCallback[] = [];
    private gitChangedCallbacks: EventCallback[] = [];

    private filesDebounceTimer: ReturnType<typeof setTimeout> | null = null;
    private gitDebounceTimer: ReturnType<typeof setTimeout> | null = null;
    private fileDebounceTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

    constructor(options: FileWatcherOptions) {
        this.cwd = options.cwd;
        this.debounceMs = options.debounceMs ?? 300;
    }

    start(): void {
        const ignoredPatterns = Array.from(FILTERED_PATTERNS).map(pattern => {
            // .git은 감시하되 내부 변경은 git-changed 이벤트로 처리
            if (pattern === '.git') {
                return undefined;
            }
            return `**/${pattern}/**`;
        }).filter(Boolean) as string[];

        this.watcher = chokidar.watch(this.cwd, {
            ignored: ignoredPatterns,
            persistent: true,
            ignoreInitial: true,
            awaitWriteFinish: {
                stabilityThreshold: 100,
                pollInterval: 50,
            },
        });

        this.watcher
            .on('add', (filePath) => this.handleFileEvent(filePath, 'add'))
            .on('unlink', (filePath) => this.handleFileEvent(filePath, 'unlink'))
            .on('change', (filePath) => this.handleFileEvent(filePath, 'change'))
            .on('addDir', (filePath) => this.handleDirEvent(filePath, 'addDir'))
            .on('unlinkDir', (filePath) => this.handleDirEvent(filePath, 'unlinkDir'))
            .on('error', (error) => {
                const code = (error as NodeJS.ErrnoException).code;
                if (code === 'ENFILE' || code === 'EMFILE') {
                    console.error('File descriptor limit reached. Disabling file watcher.');
                    this.stop();
                } else {
                    console.error('Watcher error:', error);
                }
            });
    }

    async stop(): Promise<void> {
        if (this.filesDebounceTimer) {
            clearTimeout(this.filesDebounceTimer);
        }
        if (this.gitDebounceTimer) {
            clearTimeout(this.gitDebounceTimer);
        }
        Array.from(this.fileDebounceTimers.values()).forEach(timer => {
            clearTimeout(timer);
        });
        this.fileDebounceTimers.clear();

        if (this.watcher) {
            await this.watcher.close();
            this.watcher = null;
        }
    }

    onFilesChanged(callback: EventCallback): void {
        this.filesChangedCallbacks.push(callback);
    }

    onFileChanged(callback: FileEventCallback): void {
        this.fileChangedCallbacks.push(callback);
    }

    onGitChanged(callback: EventCallback): void {
        this.gitChangedCallbacks.push(callback);
    }

    private handleFileEvent(filePath: string, event: 'add' | 'unlink' | 'change'): void {
        const relativePath = path.relative(this.cwd, filePath);

        // .git 내부 변경은 git-changed 이벤트
        if (relativePath.startsWith('.git')) {
            this.emitGitChanged();
            return;
        }

        // 파일 추가/삭제는 트리 변경
        if (event === 'add' || event === 'unlink') {
            this.emitFilesChanged();
        }

        // 파일 내용 변경
        if (event === 'change' || event === 'add') {
            this.emitFileChanged(relativePath);
        }

        // 모든 파일 변경은 잠재적으로 git 상태에 영향
        this.emitGitChanged();
    }

    private handleDirEvent(dirPath: string, event: 'addDir' | 'unlinkDir'): void {
        const relativePath = path.relative(this.cwd, dirPath);

        // .git 내부는 무시
        if (relativePath.startsWith('.git')) {
            return;
        }

        // 디렉토리 변경은 트리 변경
        this.emitFilesChanged();
    }

    private emitFilesChanged(): void {
        if (this.filesDebounceTimer) {
            clearTimeout(this.filesDebounceTimer);
        }

        this.filesDebounceTimer = setTimeout(() => {
            for (const callback of this.filesChangedCallbacks) {
                callback();
            }
        }, this.debounceMs);
    }

    private emitFileChanged(relativePath: string): void {
        const existingTimer = this.fileDebounceTimers.get(relativePath);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }

        const timer = setTimeout(() => {
            this.fileDebounceTimers.delete(relativePath);
            for (const callback of this.fileChangedCallbacks) {
                callback(relativePath);
            }
        }, this.debounceMs);

        this.fileDebounceTimers.set(relativePath, timer);
    }

    private emitGitChanged(): void {
        if (this.gitDebounceTimer) {
            clearTimeout(this.gitDebounceTimer);
        }

        this.gitDebounceTimer = setTimeout(() => {
            for (const callback of this.gitChangedCallbacks) {
                callback();
            }
        }, this.debounceMs);
    }
}
