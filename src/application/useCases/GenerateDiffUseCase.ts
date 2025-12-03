import { DiffService } from '../../domain/services/DiffService';
import { DiffResult } from '../../domain/entities/Diff';
import { ISnapshotRepository } from '../ports/outbound/ISnapshotRepository';
import { IFileSystemPort } from '../ports/outbound/IFileSystemPort';
import { IGitPort } from '../ports/outbound/IGitPort';
import { IGenerateDiffUseCase } from '../ports/inbound/IGenerateDiffUseCase';

export class GenerateDiffUseCase implements IGenerateDiffUseCase {
    constructor(
        private readonly snapshotRepository: ISnapshotRepository,
        private readonly fileSystemPort: IFileSystemPort,
        private readonly gitPort: IGitPort,
        private readonly diffService: DiffService
    ) {}

    async execute(relativePath: string): Promise<DiffResult | null> {
        const workspaceRoot = this.fileSystemPort.getWorkspaceRoot();
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
        const absolutePath = this.fileSystemPort.toAbsolutePath(relativePath);

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
