# Task 8: Add unit tests for CreateThreadUseCase file copy

## Goal

Add comprehensive unit tests for the file copy functionality in CreateThreadUseCase.

## Files to Create

- `src/test/application/useCases/CreateThreadUseCase.test.ts`

## Implementation

Create mock implementations and test all scenarios:

```typescript
import * as assert from 'assert';
import { CreateThreadUseCase } from '../../../application/useCases/CreateThreadUseCase';
import { IThreadStateRepository } from '../../../application/ports/outbound/IThreadStateRepository';
import { ITerminalPort } from '../../../application/ports/outbound/ITerminalPort';
import { IGitPort } from '../../../application/ports/outbound/IGitPort';
import { IFileSystemPort } from '../../../application/ports/outbound/IFileSystemPort';
import { IFileGlobber } from '../../../application/ports/outbound/IFileGlobber';
import { ThreadState } from '../../../domain/entities/ThreadState';

class MockThreadStateRepository implements IThreadStateRepository {
    public savedStates: ThreadState[] = [];
    async save(state: ThreadState): Promise<void> {
        this.savedStates.push(state);
    }
    // ... other methods
}

class MockTerminalPort implements ITerminalPort {
    async createTerminal(_name: string, _cwd: string): Promise<string> {
        return 'mock-terminal-id';
    }
    // ... other methods
}

class MockGitPort implements IGitPort {
    public createdWorktrees: Array<{ path: string; branch: string }> = [];
    async createWorktree(path: string, branch: string, _workspaceRoot: string): Promise<void> {
        this.createdWorktrees.push({ path, branch });
    }
    // ... other methods
}

class MockFileSystemPort implements IFileSystemPort {
    public copiedFiles: Array<{ source: string; dest: string }> = [];
    public createdDirs: string[] = [];
    public shouldFailCopy = false;
    public failOnFile?: string;

    async copyFile(source: string, dest: string): Promise<void> {
        if (this.shouldFailCopy || this.failOnFile === source) {
            throw new Error('Copy failed');
        }
        this.copiedFiles.push({ source, dest });
    }

    async ensureDir(dirPath: string): Promise<void> {
        this.createdDirs.push(dirPath);
    }

    async readFile(_path: string): Promise<string> { return ''; }
    async fileExists(_path: string): Promise<boolean> { return true; }
    async isFile(_path: string): Promise<boolean> { return true; }
    getWorkspaceRoot(): string | undefined { return '/workspace'; }
    toAbsolutePath(relativePath: string): string { return `/workspace/${relativePath}`; }
    toRelativePath(absolutePath: string): string { return absolutePath.replace('/workspace/', ''); }
}

class MockFileGlobber implements IFileGlobber {
    private results = new Map<string, string[]>();

    setPattern(pattern: string, files: string[]): void {
        this.results.set(pattern, files);
    }

    async glob(pattern: string, _cwd: string): Promise<string[]> {
        return this.results.get(pattern) ?? [];
    }
}

suite('CreateThreadUseCase', () => {
    let useCase: CreateThreadUseCase;
    let mockThreadRepo: MockThreadStateRepository;
    let mockTerminal: MockTerminalPort;
    let mockGit: MockGitPort;
    let mockFileSystem: MockFileSystemPort;
    let mockGlobber: MockFileGlobber;

    setup(() => {
        mockThreadRepo = new MockThreadStateRepository();
        mockTerminal = new MockTerminalPort();
        mockGit = new MockGitPort();
        mockFileSystem = new MockFileSystemPort();
        mockGlobber = new MockFileGlobber();

        useCase = new CreateThreadUseCase(
            mockThreadRepo,
            mockTerminal,
            mockGit,
            mockFileSystem,
            mockGlobber
        );
    });

    test('TS1: copies files matching patterns after worktree creation', async () => {
        mockGlobber.setPattern('.env*', ['/workspace/.env', '/workspace/.env.local']);
        mockGlobber.setPattern('config/local.json', ['/workspace/config/local.json']);

        await useCase.execute({
            name: 'test-thread',
            isolationMode: 'worktree',
            workspaceRoot: '/workspace',
            worktreeCopyPatterns: ['.env*', 'config/local.json'],
        });

        assert.strictEqual(mockFileSystem.copiedFiles.length, 3);
        assert.ok(mockFileSystem.createdDirs.some(d => d.includes('config')));
    });

    test('TS2: no copy when patterns empty', async () => {
        await useCase.execute({
            name: 'test-thread',
            isolationMode: 'worktree',
            workspaceRoot: '/workspace',
            worktreeCopyPatterns: [],
        });

        assert.strictEqual(mockFileSystem.copiedFiles.length, 0);
    });

    test('TS3: no error when pattern matches no files', async () => {
        mockGlobber.setPattern('.env*', []);

        await useCase.execute({
            name: 'test-thread',
            isolationMode: 'worktree',
            workspaceRoot: '/workspace',
            worktreeCopyPatterns: ['.env*'],
        });

        assert.strictEqual(mockFileSystem.copiedFiles.length, 0);
    });

    test('TS4: continues copying after failure', async () => {
        mockGlobber.setPattern('.env', ['/workspace/.env']);
        mockGlobber.setPattern('config.json', ['/workspace/config.json']);
        mockFileSystem.failOnFile = '/workspace/.env';

        await useCase.execute({
            name: 'test-thread',
            isolationMode: 'worktree',
            workspaceRoot: '/workspace',
            worktreeCopyPatterns: ['.env', 'config.json'],
        });

        assert.strictEqual(mockFileSystem.copiedFiles.length, 1);
        assert.ok(mockFileSystem.copiedFiles[0].source.includes('config.json'));
    });

    test('TS5: no copy when not worktree mode', async () => {
        mockGlobber.setPattern('.env', ['/workspace/.env']);

        await useCase.execute({
            name: 'test-thread',
            isolationMode: 'none',
            workspaceRoot: '/workspace',
            worktreeCopyPatterns: ['.env'],
        });

        assert.strictEqual(mockFileSystem.copiedFiles.length, 0);
    });

    test('TS6: preserves directory structure', async () => {
        mockGlobber.setPattern('secrets/**/*.json', ['/workspace/secrets/api/keys.json']);

        await useCase.execute({
            name: 'test-thread',
            isolationMode: 'worktree',
            workspaceRoot: '/workspace',
            worktreeCopyPatterns: ['secrets/**/*.json'],
        });

        assert.strictEqual(mockFileSystem.copiedFiles.length, 1);
        assert.ok(mockFileSystem.copiedFiles[0].dest.includes('secrets/api/keys.json'));
        assert.ok(mockFileSystem.createdDirs.some(d => d.includes('secrets/api')));
    });
});
```

## Test Scenarios

| Test | Scenario |
|------|----------|
| TS1 | Happy path - files copied with directory structure |
| TS2 | No patterns - no copy operation |
| TS3 | Pattern matches no files - no error |
| TS4 | Copy failure - continues with remaining files |
| TS5 | Non-worktree mode - no copy |
| TS6 | Nested directories created correctly |

## Acceptance Criteria

- [ ] All 6 test scenarios implemented
- [ ] Mock implementations for all ports
- [ ] Tests pass with `npm run test:unit`
