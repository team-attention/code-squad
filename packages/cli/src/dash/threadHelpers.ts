import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as crypto from 'crypto';
import type { ThreadInfo, IsolationMode, PaneInfo } from './types.js';
import { GitAdapter } from '../adapters/GitAdapter.js';
import { loadConfig, getWorktreeCopyPatterns } from '../config.js';
import { copyFilesWithPatterns } from '../fileUtils.js';

const gitAdapter = new GitAdapter();

/**
 * 로컬 스레드 타입
 */
interface LocalThread {
    id: string;
    name: string;
    path: string;
    createdAt: number;
}

/**
 * 프로젝트 해시 생성
 */
function getProjectHash(workspaceRoot: string): string {
    return crypto.createHash('sha256').update(workspaceRoot).digest('hex').slice(0, 8);
}

/**
 * 세션 파일 경로
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
 * 모든 스레드 로드 (워크트리 + 로컬)
 */
export async function loadAllThreads(
    workspaceRoot: string,
    panes: PaneInfo[] = []
): Promise<ThreadInfo[]> {
    const worktrees = await gitAdapter.listWorktrees(workspaceRoot);
    const localThreads = await loadLocalThreads(workspaceRoot);

    const threads: ThreadInfo[] = [
        ...worktrees.map(wt => {
            const pane = panes.find(p => p.worktreePath === wt.path);
            return {
                id: wt.path,
                name: wt.branch,
                type: 'worktree' as const,
                path: wt.path,
                branch: wt.branch,
                isolationMode: 'worktree' as IsolationMode,
                hasPane: !!pane,
                paneId: pane?.id,
            };
        }),
        ...localThreads.map(lt => {
            const pane = panes.find(p => p.worktreePath === lt.path);
            return {
                id: lt.id,
                name: lt.name,
                type: 'local' as const,
                path: lt.path,
                isolationMode: 'local' as IsolationMode,
                hasPane: !!pane,
                paneId: pane?.id,
            };
        }),
    ];

    return threads;
}

/**
 * 스레드 생성
 */
export async function createThread(
    workspaceRoot: string,
    name: string,
    isolationMode: IsolationMode
): Promise<ThreadInfo> {
    if (isolationMode === 'worktree') {
        const repoName = path.basename(workspaceRoot);
        const defaultBasePath = path.join(
            path.dirname(workspaceRoot),
            `${repoName}.worktree`
        );
        const worktreePath = path.join(defaultBasePath, name);

        // Git worktree 생성
        await gitAdapter.createWorktree(worktreePath, name, workspaceRoot);

        // 파일 복사
        const configData = await loadConfig(workspaceRoot);
        const patterns = getWorktreeCopyPatterns(configData);
        if (patterns.length > 0) {
            await copyFilesWithPatterns(workspaceRoot, worktreePath, patterns);
        }

        return {
            id: worktreePath,
            name,
            type: 'worktree',
            path: worktreePath,
            branch: name,
            isolationMode: 'worktree',
            hasPane: false,
        };
    } else {
        // 로컬 스레드 생성
        const threads = await loadLocalThreads(workspaceRoot);
        const newThread: LocalThread = {
            id: Date.now().toString(),
            name,
            path: workspaceRoot,
            createdAt: Date.now(),
        };
        threads.push(newThread);
        await saveLocalThreads(workspaceRoot, threads);

        return {
            id: newThread.id,
            name,
            type: 'local',
            path: workspaceRoot,
            isolationMode: 'local',
            hasPane: false,
        };
    }
}

/**
 * 스레드 삭제
 */
export async function deleteThread(
    workspaceRoot: string,
    thread: ThreadInfo
): Promise<void> {
    if (thread.type === 'worktree') {
        // Git worktree 삭제
        await gitAdapter.removeWorktree(thread.path, workspaceRoot, true);
        if (thread.branch) {
            await gitAdapter.deleteBranch(thread.branch, workspaceRoot, true);
        }
    } else {
        // 로컬 스레드 삭제
        const threads = await loadLocalThreads(workspaceRoot);
        const filtered = threads.filter(t => t.id !== thread.id);
        await saveLocalThreads(workspaceRoot, filtered);
    }
}
