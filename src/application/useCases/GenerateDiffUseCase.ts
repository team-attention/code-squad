import { DiffService } from '../../domain/services/DiffService';
import { DiffResult } from '../../domain/entities/Diff';
import { ISnapshotRepository } from '../ports/outbound/ISnapshotRepository';
import { IFileSystemPort } from '../ports/outbound/IFileSystemPort';
import { IGitPort } from '../ports/outbound/IGitPort';
import { IGenerateDiffUseCase } from '../ports/inbound/IGenerateDiffUseCase';

export class GenerateDiffUseCase implements IGenerateDiffUseCase {
    private workspaceRootOverride?: string;

    constructor(
        private readonly snapshotRepository: ISnapshotRepository,
        private readonly fileSystemPort: IFileSystemPort,
        private readonly gitPort: IGitPort,
        private readonly diffService: DiffService,
        workspaceRootOverride?: string
    ) {
        this.workspaceRootOverride = workspaceRootOverride;
    }

    /**
     * Set workspace root for worktree support.
     * Call this when switching to a different worktree.
     */
    setWorkspaceRoot(workspaceRoot: string | undefined): void {
        this.workspaceRootOverride = workspaceRoot;
    }

    /**
     * Get current workspace root.
     */
    getWorkspaceRoot(): string | undefined {
        return this.workspaceRootOverride || this.fileSystemPort.getWorkspaceRoot();
    }

    async execute(relativePath: string): Promise<DiffResult | null> {
        // 세션별 workspaceRoot 우선 사용 (worktree 지원)
        const workspaceRoot = this.workspaceRootOverride || this.fileSystemPort.getWorkspaceRoot();
        if (!workspaceRoot) return null;

        let diffResult: DiffResult;

        if (this.snapshotRepository.has(relativePath)) {
            diffResult = await this.generateSnapshotDiff(relativePath);
        } else {
            const rawDiff = await this.gitPort.getDiff(workspaceRoot, relativePath);
            diffResult = this.diffService.parseUnifiedDiff(relativePath, rawDiff);
        }

        if (diffResult.chunks.length === 0) {
            return null;
        }

        return diffResult;
    }

    private async generateSnapshotDiff(relativePath: string): Promise<DiffResult> {
        const snapshot = await this.snapshotRepository.findByPath(relativePath);
        // Use workspaceRootOverride for worktree support
        const workspaceRoot = this.getWorkspaceRoot();
        const absolutePath = workspaceRoot
            ? this.fileSystemPort.joinPath(workspaceRoot, relativePath)
            : relativePath;

        let currentContent = '';
        let fileExists = false;
        try {
            fileExists = await this.fileSystemPort.fileExists(absolutePath);
            if (fileExists) {
                currentContent = await this.fileSystemPort.readFile(absolutePath);
            }
        } catch {
            return { file: relativePath, chunks: [], stats: { additions: 0, deletions: 0 } };
        }

        // Case 1: No snapshot exists
        if (snapshot === undefined) {
            if (!currentContent) {
                return { file: relativePath, chunks: [], stats: { additions: 0, deletions: 0 } };
            }
            return this.diffService.generateNewFileStructuredDiff(relativePath, currentContent);
        }

        // Case 2: Snapshot exists but file was deleted
        if (!fileExists || !currentContent) {
            return this.diffService.generateDeletedFileStructuredDiff(relativePath, snapshot.content);
        }

        // Case 3: Both snapshot and current content exist - compare them
        return this.diffService.generateStructuredDiff(relativePath, snapshot.content, currentContent);
    }
}
