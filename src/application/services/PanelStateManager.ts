import { DiffResult } from '../../domain/entities/Diff';
import { IPanelPort } from '../ports/outbound/IPanelPort';
import {
    PanelState,
    FileInfo,
    CommentInfo,
    AIStatus,
    createInitialPanelState,
} from '../ports/outbound/PanelState';
import { IPanelStateManager } from './IPanelStateManager';

/**
 * Panel state manager implementation
 *
 * Manages UI state and automatically triggers render on changes.
 */
export class PanelStateManager implements IPanelStateManager {
    private state: PanelState;
    private panelPort: IPanelPort | null = null;

    constructor() {
        this.state = createInitialPanelState();
    }

    /**
     * Set the panel port (called when panel is created)
     */
    setPanelPort(panelPort: IPanelPort): void {
        this.panelPort = panelPort;
        this.render();
    }

    /**
     * Clear the panel port (called when panel is disposed)
     */
    clearPanelPort(): void {
        this.panelPort = null;
    }

    getState(): PanelState {
        return { ...this.state };
    }

    // ===== File operations =====

    addFile(file: FileInfo): void {
        const exists = this.state.files.some(f => f.path === file.path);
        if (!exists) {
            this.state = {
                ...this.state,
                files: [...this.state.files, file],
            };
            this.render();
        }
    }

    removeFile(path: string): void {
        const newFiles = this.state.files.filter(f => f.path !== path);
        if (newFiles.length !== this.state.files.length) {
            this.state = {
                ...this.state,
                files: newFiles,
                // Clear diff if removed file was selected
                selectedFile: this.state.selectedFile === path ? null : this.state.selectedFile,
                diff: this.state.diff?.file === path ? null : this.state.diff,
            };
            this.render();
        }
    }

    selectFile(path: string | null): void {
        if (this.state.selectedFile !== path) {
            this.state = {
                ...this.state,
                selectedFile: path,
            };
            this.render();
        }
    }

    // ===== Diff operations =====

    showDiff(diff: DiffResult): void {
        this.state = {
            ...this.state,
            diff,
            selectedFile: diff.file,
        };
        this.render();
    }

    clearDiff(): void {
        this.state = {
            ...this.state,
            diff: null,
        };
        this.render();
    }

    // ===== Comment operations =====

    addComment(comment: CommentInfo): void {
        this.state = {
            ...this.state,
            comments: [...this.state.comments, comment],
        };
        this.render();
    }

    removeComment(id: string): void {
        this.state = {
            ...this.state,
            comments: this.state.comments.filter(c => c.id !== id),
        };
        this.render();
    }

    clearComments(): void {
        this.state = {
            ...this.state,
            comments: [],
        };
        this.render();
    }

    // ===== AI status =====

    setAIStatus(status: AIStatus): void {
        this.state = {
            ...this.state,
            aiStatus: status,
        };
        this.render();
    }

    // ===== Reset =====

    reset(): void {
        this.state = createInitialPanelState();
        this.render();
    }

    // ===== Private =====

    private render(): void {
        if (this.panelPort) {
            this.panelPort.render(this.state);
        }
    }
}
