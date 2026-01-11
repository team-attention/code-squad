import * as fs from 'fs';
import * as path from 'path';
import fg from 'fast-glob';

/**
 * glob 패턴에 매칭되는 파일들을 소스에서 대상으로 복사
 */
export async function copyFilesWithPatterns(
    sourceRoot: string,
    destRoot: string,
    patterns: string[]
): Promise<{ copied: string[]; failed: string[] }> {
    const copied: string[] = [];
    const failed: string[] = [];

    if (patterns.length === 0) {
        return { copied, failed };
    }

    for (const pattern of patterns) {
        try {
            const files = await fg(pattern, {
                cwd: sourceRoot,
                absolute: true,
                onlyFiles: true,
                dot: true, // .env 같은 dotfile도 매칭
            });

            for (const absolutePath of files) {
                try {
                    await copySingleFile(absolutePath, sourceRoot, destRoot);
                    const relativePath = path.relative(sourceRoot, absolutePath);
                    copied.push(relativePath);
                } catch {
                    const relativePath = path.relative(sourceRoot, absolutePath);
                    failed.push(relativePath);
                }
            }
        } catch {
            // glob 패턴 실패 시 무시
        }
    }

    return { copied, failed };
}

/**
 * 단일 파일 복사 (디렉토리 생성 포함)
 */
async function copySingleFile(
    absolutePath: string,
    sourceRoot: string,
    destRoot: string
): Promise<void> {
    const relativePath = path.relative(sourceRoot, absolutePath);
    const destPath = path.join(destRoot, relativePath);
    const destDir = path.dirname(destPath);

    // 대상 디렉토리 생성
    await fs.promises.mkdir(destDir, { recursive: true });

    // 파일 복사
    await fs.promises.copyFile(absolutePath, destPath);
}
