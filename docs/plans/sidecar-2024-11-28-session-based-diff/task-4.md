# Task 4: Capture Baseline on AI Session Start

## Goal

When an AI session starts, capture the baseline of uncommitted files.

## Dependencies

- Task 1 (IGitPort.getUncommittedFiles)
- Task 3 (PanelStateManager baseline methods)

## Files to Modify

1. `src/adapters/inbound/controllers/AIDetectionController.ts`

## Implementation

### AIDetectionController.ts

Add IGitPort and IFileGlobber dependencies, capture baseline in `activateSidecar()`:

```typescript
import { IGitPort } from '../../../application/ports/outbound/IGitPort';
import { IFileGlobber } from '../../../application/ports/outbound/IFileGlobber';
import { FileInfo } from '../../../application/ports/outbound/PanelState';
import * as path from 'path';

export class AIDetectionController {
    private activeAISessions = new Map<string, AISession>();
    private panelStateManager: IPanelStateManager | undefined;

    constructor(
        private readonly captureSnapshotsUseCase: ICaptureSnapshotsUseCase,
        private readonly snapshotRepository: ISnapshotRepository,
        private readonly terminalGateway: VscodeTerminalGateway,
        private readonly getExtensionContext: () => vscode.ExtensionContext,
        private readonly gitPort: IGitPort,           // NEW
        private readonly fileGlobber: IFileGlobber    // NEW
    ) {}

    // ... existing methods

    private async activateSidecar(type: AIType, terminal: vscode.Terminal): Promise<void> {
        const terminalId = this.getTerminalId(terminal);
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

        // Capture snapshots (existing)
        try {
            const config = vscode.workspace.getConfiguration('sidecar');
            const includePatterns = config.get<string[]>('includeFiles', []);
            await this.captureSnapshotsUseCase.execute(includePatterns);
        } catch (error) {
            console.error('Failed to capture snapshots:', error);
        }

        // NEW: Capture baseline
        if (workspaceRoot && this.panelStateManager) {
            await this.captureBaseline(workspaceRoot);
        }

        // ... rest of existing code (moveTerminalToSide, showPanel, etc.)
    }

    // NEW METHOD
    private async captureBaseline(workspaceRoot: string): Promise<void> {
        try {
            const config = vscode.workspace.getConfiguration('sidecar');
            const includePatterns = config.get<string[]>('includeFiles', []);

            // Get uncommitted files from git
            const gitFiles = await this.gitPort.getUncommittedFiles(workspaceRoot);

            // Get files matching includePatterns (for gitignored but tracked files)
            let configFiles: string[] = [];
            if (includePatterns.length > 0) {
                configFiles = await this.fileGlobber.glob(workspaceRoot, includePatterns);
            }

            // Union of both sources, deduplicated
            const allPaths = new Set([...gitFiles, ...configFiles]);

            // Convert to FileInfo array
            const baselineFiles: FileInfo[] = Array.from(allPaths).map(filePath => ({
                path: filePath,
                name: path.basename(filePath),
                status: 'modified' as const,
            }));

            // Store baseline in state manager
            this.panelStateManager!.setBaseline(baselineFiles);

            console.log(`Baseline captured: ${baselineFiles.length} files`);
        } catch (error) {
            console.error('Failed to capture baseline:', error);
        }
    }
}
```

### Update extension.ts (DI wiring)

Pass the new dependencies to AIDetectionController:

```typescript
const aiDetectionController = new AIDetectionController(
    captureSnapshotsUseCase,
    snapshotRepository,
    terminalGateway,
    () => extensionContext,
    gitGateway,      // NEW
    fileGlobber      // NEW
);
```

## Validation

- [ ] AIDetectionController receives IGitPort and IFileGlobber
- [ ] `captureBaseline()` is called during `activateSidecar()`
- [ ] Baseline combines git uncommitted files and config pattern files
- [ ] Baseline is stored in PanelStateManager
- [ ] extension.ts passes the new dependencies
