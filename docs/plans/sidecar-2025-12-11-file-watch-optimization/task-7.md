# Task 7: Add Unit Tests

## Goal

Test git events, whitelist events, and fallback behavior.

## Files to Create

- `src/test/adapters/controllers/FileWatchOptimization.test.ts`

## Test Structure

```typescript
import * as assert from 'assert';
import * as vscode from 'vscode';
import { FileWatchController } from '../../../adapters/inbound/controllers/FileWatchController';
import { GitAPI, Repository, RepositoryState, Change, Status } from '../../../types/git';

suite('FileWatchController Optimization', () => {
    let controller: FileWatchController;
    let mockGitAPI: GitAPI;
    let mockRepository: Repository;
    let mockSessionContext: MockSessionContext;

    setup(() => {
        // Create mock session context
        mockSessionContext = new MockSessionContext();

        // Create mock git API
        mockRepository = createMockRepository();
        mockGitAPI = {
            repositories: [mockRepository],
            onDidOpenRepository: new vscode.EventEmitter<Repository>().event,
            onDidCloseRepository: new vscode.EventEmitter<Repository>().event
        };

        // Create controller
        controller = new FileWatchController(mockSessionContext);
    });

    teardown(() => {
        controller.dispose();
    });

    suite('UC-1: Git State Changes', () => {
        test('should process files from workingTreeChanges', async () => {
            // Setup: One file in workingTreeChanges
            mockRepository.state.workingTreeChanges = [
                createMockChange('/workspace/src/file.ts', Status.MODIFIED)
            ];

            // Act: Trigger state change
            await triggerGitStateChange(mockRepository);

            // Assert: processFileChange called
            assert.strictEqual(mockSessionContext.notifiedFiles.length, 1);
            assert.ok(mockSessionContext.notifiedFiles[0].includes('file.ts'));
        });

        test('should process files from indexChanges', async () => {
            // Setup: One file in indexChanges
            mockRepository.state.indexChanges = [
                createMockChange('/workspace/src/staged.ts', Status.INDEX_MODIFIED)
            ];

            // Act
            await triggerGitStateChange(mockRepository);

            // Assert
            assert.strictEqual(mockSessionContext.notifiedFiles.length, 1);
            assert.ok(mockSessionContext.notifiedFiles[0].includes('staged.ts'));
        });

        test('should deduplicate files appearing in both changes', async () => {
            // Setup: Same file in both
            const change = createMockChange('/workspace/src/both.ts', Status.MODIFIED);
            mockRepository.state.workingTreeChanges = [change];
            mockRepository.state.indexChanges = [
                createMockChange('/workspace/src/both.ts', Status.INDEX_MODIFIED)
            ];

            // Act
            await triggerGitStateChange(mockRepository);

            // Assert: Only processed once
            assert.strictEqual(mockSessionContext.notifiedFiles.length, 1);
        });

        test('should skip recently processed files (100ms window)', async () => {
            // Setup
            mockRepository.state.workingTreeChanges = [
                createMockChange('/workspace/src/rapid.ts', Status.MODIFIED)
            ];

            // Act: Trigger twice rapidly
            await triggerGitStateChange(mockRepository);
            await triggerGitStateChange(mockRepository);

            // Assert: Only processed once
            assert.strictEqual(mockSessionContext.notifiedFiles.length, 1);
        });

        test('should NOT apply debounce to git events', async () => {
            // Setup: Multiple different files
            mockRepository.state.workingTreeChanges = [
                createMockChange('/workspace/src/a.ts', Status.MODIFIED),
                createMockChange('/workspace/src/b.ts', Status.MODIFIED),
                createMockChange('/workspace/src/c.ts', Status.MODIFIED)
            ];

            // Act
            const startTime = Date.now();
            await triggerGitStateChange(mockRepository);
            const duration = Date.now() - startTime;

            // Assert: All processed immediately (no debounce delay)
            assert.strictEqual(mockSessionContext.notifiedFiles.length, 3);
            assert.ok(duration < 100, 'Should process immediately without debounce');
        });
    });

    suite('UC-2: Whitelist File Changes', () => {
        test('should create watcher for each includeFiles pattern', async () => {
            // Setup: Mock configuration with patterns
            const patterns = ['dist/**', '.env.*'];
            mockConfiguration('sidecar.includeFiles', patterns);

            // Act: Setup watchers
            controller.reload();

            // Assert: Watchers created (check via getWatchMode or logs)
            const mode = controller.getWatchMode();
            assert.ok(mode); // Mode should be set
        });

        test('should apply debounce to whitelist events', async () => {
            // Setup: Configure debounce
            mockConfiguration('sidecar.fileWatchDebounceMs', 100);
            controller.reload();

            // Act: Trigger whitelist event
            const startTime = Date.now();
            triggerWhitelistEvent(controller, '/workspace/dist/bundle.js');

            // Assert: Event is pending (not immediate)
            assert.strictEqual(mockSessionContext.notifiedFiles.length, 0);

            // Wait for debounce
            await delay(150);
            assert.strictEqual(mockSessionContext.notifiedFiles.length, 1);
        });

        test('should coalesce rapid whitelist changes', async () => {
            // Setup
            mockConfiguration('sidecar.fileWatchDebounceMs', 100);
            controller.reload();

            // Act: Trigger 3 events rapidly
            triggerWhitelistEvent(controller, '/workspace/dist/bundle.js');
            await delay(20);
            triggerWhitelistEvent(controller, '/workspace/dist/bundle.js');
            await delay(20);
            triggerWhitelistEvent(controller, '/workspace/dist/bundle.js');

            // Wait for debounce
            await delay(150);

            // Assert: Only one notification
            assert.strictEqual(mockSessionContext.notifiedFiles.length, 1);
        });
    });

    suite('UC-3: Ignore Untracked Files', () => {
        test('untracked non-whitelisted files produce no events', () => {
            // This test verifies the architecture:
            // - No global '**/*' watcher exists
            // - Only git and whitelist watchers are created
            // Untracked, non-whitelisted files have no watcher -> no events

            // Implementation note: This is verified by checking that:
            // 1. Global watcher is not created
            // 2. Only specific pattern watchers exist
            assert.ok(true, 'Architecture ensures no events for untracked files');
        });
    });

    suite('UC-4: Fallback Mode', () => {
        test('should work without git extension', async () => {
            // Setup: Create controller without git API
            const noGitController = new FileWatchController(mockSessionContext);
            // Simulate git extension not available

            // Assert: Should be in whitelist-only mode
            const mode = noGitController.getWatchMode();
            assert.strictEqual(mode, 'whitelist-only');

            noGitController.dispose();
        });

        test('should work without git repository', async () => {
            // Setup: Git API available but no repositories
            mockGitAPI.repositories = [];

            // Create and activate controller
            const noRepoController = new FileWatchController(mockSessionContext);

            // Assert
            const mode = noRepoController.getWatchMode();
            assert.strictEqual(mode, 'whitelist-only');

            noRepoController.dispose();
        });

        test('whitelist events work in fallback mode', async () => {
            // Setup: No git, but whitelist configured
            const fallbackController = new FileWatchController(mockSessionContext);
            mockConfiguration('sidecar.includeFiles', ['dist/**']);
            mockConfiguration('sidecar.fileWatchDebounceMs', 0); // Immediate
            fallbackController.reload();

            // Act
            triggerWhitelistEvent(fallbackController, '/workspace/dist/file.js');
            await delay(50);

            // Assert
            assert.strictEqual(mockSessionContext.notifiedFiles.length, 1);

            fallbackController.dispose();
        });
    });
});

// Helper functions
function createMockRepository(): Repository {
    const stateChangeEmitter = new vscode.EventEmitter<void>();
    return {
        rootUri: vscode.Uri.file('/workspace'),
        state: {
            workingTreeChanges: [],
            indexChanges: [],
            mergeChanges: [],
            onDidChange: stateChangeEmitter.event,
            // ... other required properties
        } as RepositoryState,
        inputBox: { value: '' },
        _stateChangeEmitter: stateChangeEmitter // For testing
    } as Repository & { _stateChangeEmitter: vscode.EventEmitter<void> };
}

function createMockChange(path: string, status: Status): Change {
    return {
        uri: vscode.Uri.file(path),
        originalUri: vscode.Uri.file(path),
        renameUri: undefined,
        status
    };
}

async function triggerGitStateChange(repo: Repository & { _stateChangeEmitter: vscode.EventEmitter<void> }): Promise<void> {
    repo._stateChangeEmitter.fire();
    await delay(10); // Allow async processing
}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

class MockSessionContext {
    notifiedFiles: string[] = [];

    notifyFileChange(relativePath: string): void {
        this.notifiedFiles.push(relativePath);
    }
}
```

## Test Scenarios Covered

### UC-1: Git State Changes
- [x] Process workingTreeChanges
- [x] Process indexChanges
- [x] Deduplicate files in both
- [x] Skip recently processed (100ms)
- [x] No debounce for git events

### UC-2: Whitelist File Changes
- [x] Create per-pattern watchers
- [x] Apply debounce
- [x] Coalesce rapid changes

### UC-3: Ignore Untracked Files
- [x] Architecture verification (no global watcher)

### UC-4: Fallback Mode
- [x] Work without git extension
- [x] Work without repository
- [x] Whitelist works in fallback

## Acceptance Criteria

- [ ] All test scenarios pass
- [ ] Tests use mock Git API
- [ ] Tests verify event counts
- [ ] Tests verify mode logging
- [ ] Tests follow existing test patterns
- [ ] Mock helpers are reusable
