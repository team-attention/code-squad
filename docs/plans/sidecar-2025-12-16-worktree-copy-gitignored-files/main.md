# Plan: Auto-copy Gitignored Files on Worktree Creation

## Overview

Automatically copy gitignored files (like `.env`, config files) from the main workspace to newly created worktrees based on user-defined glob patterns. Eliminates manual file copying when creating worktree-isolated threads.

## Technical Design

### Architecture Decision: Extend CreateThreadUseCase

**Chosen Approach**: Add copy logic directly to CreateThreadUseCase

**Rationale**:
- Copying is integral to worktree creation (only when `isolationMode === 'worktree'`)
- Keeps operation atomic - copy failures are non-blocking
- Avoids proliferation of small use cases for tightly coupled operations

### Layer Responsibilities

| Layer | Component | Responsibility |
|-------|-----------|----------------|
| Adapters | ThreadListController | Read VSCode config, pass patterns to use case |
| Application | CreateThreadUseCase | Orchestrate file copy after worktree creation |
| Application | IFileSystemPort | Extended with `copyFile()`, `ensureDir()` |
| Application | IFileGlobber | Existing - glob matching |
| Adapters | VscodeFileSystemGateway | Implement file operations using fs.promises |

### Data Flow

```
User creates thread (worktree mode)
    │
    ▼
ThreadListController (reads codeSquad.worktreeCopyPatterns)
    │ createThreadUseCase.execute({ ..., worktreeCopyPatterns })
    ▼
CreateThreadUseCase
    │ 1. Create worktree (existing)
    │ 2. If worktree mode && patterns.length > 0:
    │    a. For each pattern: glob(pattern, workspaceRoot)
    │    b. For each file: copyFile(src, dest) with ensureDir
    │ 3. Create terminal, save thread state
    ▼
Output: ThreadState (unchanged)
```

### Interface Changes

**CreateThreadInput**:
```typescript
export interface CreateThreadInput {
    // ... existing
    worktreeCopyPatterns?: string[];  // NEW
}
```

**IFileSystemPort**:
```typescript
export interface IFileSystemPort {
    // ... existing
    copyFile(source: string, dest: string): Promise<void>;
    ensureDir(dirPath: string): Promise<void>;
}
```

### Error Handling

- Non-existent source files: Skip silently
- Copy failure: Log warning, continue with remaining files
- Empty patterns: No-op
- **Copy failures never block thread creation**

## Test Scenarios

### TS1: Happy Path - Files Copied Successfully
```
Given: worktreeCopyPatterns = ['.env*', 'config/local.json']
  And: .env, .env.local, config/local.json exist
When: Create thread with isolationMode = 'worktree'
Then: All files copied preserving directory structure
```

### TS2: No Patterns Configured
```
Given: worktreeCopyPatterns = []
When: Create thread with isolationMode = 'worktree'
Then: No copy operation, thread created normally
```

### TS3: Pattern Matches No Files
```
Given: worktreeCopyPatterns = ['.env*']
  And: No .env files exist
When: Create thread with isolationMode = 'worktree'
Then: No files copied, thread created normally
```

### TS4: Copy Failure - Continue With Remaining
```
Given: worktreeCopyPatterns = ['.env', 'config.json']
  And: .env unreadable, config.json readable
When: Create thread with isolationMode = 'worktree'
Then: .env copy fails (logged), config.json copied, thread succeeds
```

### TS5: Non-Worktree Mode - No Copy
```
Given: worktreeCopyPatterns = ['.env']
When: Create thread with isolationMode = 'none'
Then: No copy operation performed
```

### TS6: Directory Structure Preserved
```
Given: worktreeCopyPatterns = ['secrets/**/*.json']
  And: secrets/api/keys.json exists
When: Create thread with isolationMode = 'worktree'
Then: secrets/api/ created in worktree, keys.json copied
```

## Task List

| # | Task | Files |
|---|------|-------|
| 1 | [Add configuration to package.json](./task-1.md) | `package.json` |
| 2 | [Extend IFileSystemPort](./task-2.md) | `src/application/ports/outbound/IFileSystemPort.ts` |
| 3 | [Implement in VscodeFileSystemGateway](./task-3.md) | `src/adapters/outbound/gateways/VscodeFileSystemGateway.ts` |
| 4 | [Add worktreeCopyPatterns to CreateThreadInput](./task-4.md) | `src/application/ports/inbound/ICreateThreadUseCase.ts` |
| 5 | [Implement file copy in CreateThreadUseCase](./task-5.md) | `src/application/useCases/CreateThreadUseCase.ts` |
| 6 | [Read config in ThreadListController](./task-6.md) | `src/adapters/inbound/controllers/ThreadListController.ts` |
| 7 | [Wire dependencies in extension.ts](./task-7.md) | `src/extension.ts` |
| 8 | [Add unit tests](./task-8.md) | `src/test/application/useCases/CreateThreadUseCase.test.ts` |

## Dependencies

```
Task 1 (package.json) ─────────────────────────┐
Task 2 (IFileSystemPort) ─┬─ Task 3 (Gateway)  │
Task 4 (Input interface) ─┼─ Task 5 (UseCase) ─┼─ Task 6 (Controller)
                          │                    │
Task 2, 3 ────────────────┘                    │
Task 5 ────────────────────────────────────────┼─ Task 7 (DI wiring)
Task 5, 7 ─────────────────────────────────────┴─ Task 8 (Tests)
```

## Success Criteria

- [ ] Configuration `codeSquad.worktreeCopyPatterns` available in settings
- [ ] Files matching patterns copied after worktree creation
- [ ] Directory structure preserved
- [ ] Copy failures do not block thread creation
- [ ] Unit tests cover all scenarios
