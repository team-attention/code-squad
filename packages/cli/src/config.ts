import * as fs from 'fs';
import * as path from 'path';

/**
 * Code Squad 프로젝트 설정 파일 스키마
 * 프로젝트 루트의 .code-squad.json 파일에서 로드
 */
export interface CodeSquadConfig {
    /**
     * 워크트리 생성 시 복사할 파일 패턴 (glob)
     * gitignore된 파일도 복사됨
     * 예: [".env*", "config/**", ".vscode/settings.json"]
     */
    worktreeCopyPatterns?: string[];
}

const CONFIG_FILE_NAME = '.code-squad.json';

/**
 * 프로젝트 루트에서 설정 파일 로드
 * 파일이 없거나 파싱 실패 시 빈 객체 반환
 */
export async function loadConfig(workspaceRoot: string): Promise<CodeSquadConfig> {
    const configPath = path.join(workspaceRoot, CONFIG_FILE_NAME);

    try {
        const content = await fs.promises.readFile(configPath, 'utf-8');
        const config = JSON.parse(content) as CodeSquadConfig;
        return config;
    } catch {
        // 파일 없거나 파싱 실패 시 빈 설정 반환
        return {};
    }
}

/**
 * 설정에서 worktreeCopyPatterns 가져오기
 */
export function getWorktreeCopyPatterns(config: CodeSquadConfig): string[] {
    return config.worktreeCopyPatterns ?? [];
}
