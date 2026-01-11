import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

/**
 * 프로젝트별 설정
 */
export interface ProjectConfig {
    /**
     * 워크트리 생성 시 복사할 파일 패턴 (glob)
     * gitignore된 파일도 복사됨
     * 예: [".env*", "config/**", ".vscode/settings.json"]
     */
    worktreeCopyPatterns?: string[];
}

/**
 * 글로벌 설정 파일 스키마
 * ~/.code-squad/config.json 에서 로드
 */
export interface GlobalConfig {
    /**
     * 모든 프로젝트에 적용되는 기본 설정
     */
    defaults?: ProjectConfig;
    /**
     * 프로젝트별 설정
     * 키: 프로젝트 경로 (절대 경로)
     */
    projects?: Record<string, ProjectConfig>;
}

const GLOBAL_CONFIG_PATH = path.join(os.homedir(), '.code-squad', 'config.json');

/**
 * 글로벌 설정 파일 로드
 */
async function loadGlobalConfig(): Promise<GlobalConfig> {
    try {
        const content = await fs.promises.readFile(GLOBAL_CONFIG_PATH, 'utf-8');
        return JSON.parse(content) as GlobalConfig;
    } catch (error: unknown) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
            return {};
        }
        console.warn(`[Code Squad] Warning: Could not load global config at ${GLOBAL_CONFIG_PATH}.`, error);
        return {};
    }
}

/**
 * 프로젝트 설정 로드
 * 글로벌 설정에서 해당 프로젝트 경로의 설정을 찾고, defaults와 병합
 */
export async function loadConfig(workspaceRoot: string): Promise<ProjectConfig> {
    const globalConfig = await loadGlobalConfig();
    const normalizedPath = path.resolve(workspaceRoot);
    const projectConfig = globalConfig.projects?.[normalizedPath] ?? {};
    const defaults = globalConfig.defaults ?? {};

    return {
        ...defaults,
        ...projectConfig,
        worktreeCopyPatterns: [
            ...new Set([
                ...(defaults.worktreeCopyPatterns ?? []),
                ...(projectConfig.worktreeCopyPatterns ?? []),
            ]),
        ],
    };
}

/**
 * 설정에서 worktreeCopyPatterns 가져오기
 */
export function getWorktreeCopyPatterns(config: ProjectConfig): string[] {
    return config.worktreeCopyPatterns ?? [];
}
