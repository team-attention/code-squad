# Task 5: Implement file copy logic in CreateThreadUseCase

## Goal

Add file copy logic to CreateThreadUseCase that copies gitignored files after worktree creation.

## Files to Modify

- `src/application/useCases/CreateThreadUseCase.ts`

## Implementation

1. Add `fileSystemPort` and `fileGlobber` to constructor
2. After worktree creation, implement copy logic:

```typescript
import * as path from 'path';
import { ThreadState } from '../../domain/entities/ThreadState';
import { IThreadStateRepository } from '../ports/outbound/IThreadStateRepository';
import { ITerminalPort } from '../ports/outbound/ITerminalPort';
import { IGitPort } from '../ports/outbound/IGitPort';
import { IFileSystemPort } from '../ports/outbound/IFileSystemPort';
import { IFileGlobber } from '../ports/outbound/IFileGlobber';
import {
    ICreateThreadUseCase,
    CreateThreadInput,
    CreateThreadOutput,
} from '../ports/inbound/ICreateThreadUseCase';

export class CreateThreadUseCase implements ICreateThreadUseCase {
    constructor(
        private readonly threadStateRepository: IThreadStateRepository,
        private readonly terminalPort: ITerminalPort,
        private readonly gitPort: IGitPort,
        private readonly fileSystemPort: IFileSystemPort,
        private readonly fileGlobber: IFileGlobber
    ) {}

    async execute(input: CreateThreadInput): Promise<CreateThreadOutput> {
        const { name, isolationMode, branchName, worktreePath: customWorktreePath, workspaceRoot } = input;
        const effectiveBranchName = branchName ?? name;

        let workingDir = workspaceRoot;
        let branch: string | undefined;
        let worktreePath: string | undefined;

        if (isolationMode === 'worktree') {
            if (customWorktreePath) {
                worktreePath = path.resolve(workspaceRoot, customWorktreePath);
            } else {
                const workspaceName = path.basename(workspaceRoot);
                const worktreeBaseDir = path.join(path.dirname(workspaceRoot), `${workspaceName}.worktree`);
                worktreePath = path.join(worktreeBaseDir, effectiveBranchName);
            }
            await this.gitPort.createWorktree(worktreePath, effectiveBranchName, workspaceRoot);
            workingDir = worktreePath;
            branch = effectiveBranchName;

            // Copy gitignored files to worktree
            await this.copyWorktreeFiles(
                workspaceRoot,
                worktreePath,
                input.worktreeCopyPatterns ?? []
            );
        }

        const terminalId = await this.terminalPort.createTerminal(name, workingDir);

        const threadState = ThreadState.create({
            name,
            terminalId,
            workingDir,
            branch,
            worktreePath,
            whitelistPatterns: [],
        });

        await this.threadStateRepository.save(threadState);

        return { threadState };
    }

    private async copyWorktreeFiles(
        sourceRoot: string,
        destRoot: string,
        patterns: string[]
    ): Promise<void> {
        if (patterns.length === 0) return;

        for (const pattern of patterns) {
            try {
                const files = await this.fileGlobber.glob(pattern, sourceRoot);
                for (const absolutePath of files) {
                    await this.copySingleFile(absolutePath, sourceRoot, destRoot);
                }
            } catch (error) {
                console.warn(`[Code Squad] Failed to glob pattern "${pattern}":`, error);
            }
        }
    }

    private async copySingleFile(
        absolutePath: string,
        sourceRoot: string,
        destRoot: string
    ): Promise<void> {
        try {
            const relativePath = path.relative(sourceRoot, absolutePath);
            const destPath = path.join(destRoot, relativePath);
            const destDir = path.dirname(destPath);

            await this.fileSystemPort.ensureDir(destDir);
            await this.fileSystemPort.copyFile(absolutePath, destPath);
        } catch (error) {
            console.warn(`[Code Squad] Failed to copy "${absolutePath}":`, error);
        }
    }
}
```

## Test Scenarios

See main.md TS1-TS6

## What to Mock

- `IFileSystemPort` - mock `copyFile`, `ensureDir`
- `IFileGlobber` - mock `glob` to return controlled file lists
- `IGitPort` - mock `createWorktree`
- `ITerminalPort` - mock `createTerminal`
- `IThreadStateRepository` - mock `save`

## Acceptance Criteria

- [ ] Constructor accepts `fileSystemPort` and `fileGlobber`
- [ ] Files matching patterns copied after worktree creation
- [ ] Directory structure preserved via `path.relative` + `ensureDir`
- [ ] Copy failures logged but don't block execution
- [ ] No copy when `isolationMode !== 'worktree'`
- [ ] No copy when patterns array is empty
