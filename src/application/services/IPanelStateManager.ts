import { DiffResult } from '../../domain/entities/Diff';
import { PanelState, FileInfo, CommentInfo, AIStatus } from '../ports/outbound/PanelState';

/**
 * Panel state manager - manages UI state and triggers rendering
 *
 * UseCase들이 이 인터페이스를 통해 UI 상태를 변경한다.
 * 상태 변경 시 자동으로 IPanelPort.render()가 호출된다.
 */
export interface IPanelStateManager {
    // State access
    getState(): PanelState;

    // File operations (intent-level)
    addFile(file: FileInfo): void;
    removeFile(path: string): void;
    selectFile(path: string | null): void;

    // Diff operations
    showDiff(diff: DiffResult): void;
    clearDiff(): void;

    // Comment operations
    addComment(comment: CommentInfo): void;
    removeComment(id: string): void;
    clearComments(): void;

    // AI status
    setAIStatus(status: AIStatus): void;

    // Reset state (e.g., when panel closes)
    reset(): void;
}
