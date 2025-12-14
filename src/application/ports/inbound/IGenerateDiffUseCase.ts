import { DiffResult } from '../../../domain/entities/Diff';

export interface IGenerateDiffUseCase {
    execute(relativePath: string): Promise<DiffResult | null>;

    /**
     * Set workspace root for worktree support.
     * Call this when switching to a different worktree.
     */
    setWorkspaceRoot(workspaceRoot: string | undefined): void;

    /**
     * Get current workspace root.
     */
    getWorkspaceRoot(): string | undefined;
}
