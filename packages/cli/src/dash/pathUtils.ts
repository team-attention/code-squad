import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { GitAdapter } from '../adapters/GitAdapter.js';

const gitAdapter = new GitAdapter();

/**
 * ~ 를 홈 디렉토리로 확장
 */
export function expandTilde(p: string): string {
    if (p === '~') return os.homedir();
    if (p.startsWith('~/')) return path.join(os.homedir(), p.slice(2));
    return p;
}

/**
 * 경로를 parentDir + leafPrefix로 분리 (자동완성용)
 */
export function splitPathForCompletion(p: string): { parentDir: string; leafPrefix: string } {
    const expanded = expandTilde(p);
    if (expanded.endsWith('/')) {
        return { parentDir: expanded, leafPrefix: '' };
    }
    return {
        parentDir: path.dirname(expanded),
        leafPrefix: path.basename(expanded),
    };
}

/**
 * 긴 경로를 maxLen 이하로 축약 (앞부분을 ...로 대체)
 */
export function truncatePath(p: string, maxLen: number): string {
    if (p.length <= maxLen) return p;
    return '...' + p.slice(p.length - maxLen + 3);
}

export type PathStatus = 'valid' | 'creatable' | 'invalid';

export interface PathValidationResult {
    status: PathStatus;
    isGitRepo: boolean;
}

/**
 * 경로 유효성 검사
 * - valid: 디렉토리가 존재
 * - creatable: 부모가 존재하고 마지막 한 단계만 새로 생성 가능
 * - invalid: 그 외
 */
export async function validatePath(p: string): Promise<PathValidationResult> {
    const expanded = expandTilde(p);
    if (!expanded || !path.isAbsolute(expanded)) {
        return { status: 'invalid', isGitRepo: false };
    }

    try {
        const stat = await fs.promises.stat(expanded);
        if (stat.isDirectory()) {
            const isGitRepo = await gitAdapter.isGitRepository(expanded);
            return { status: 'valid', isGitRepo };
        }
        return { status: 'invalid', isGitRepo: false };
    } catch {
        // 존재하지 않음 — 부모가 존재하면 creatable
        const parent = path.dirname(expanded);
        try {
            const parentStat = await fs.promises.stat(parent);
            if (parentStat.isDirectory()) {
                return { status: 'creatable', isGitRepo: false };
            }
        } catch {
            // 부모도 없음
        }
        return { status: 'invalid', isGitRepo: false };
    }
}
