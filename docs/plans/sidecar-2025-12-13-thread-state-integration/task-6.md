# Task 6: Add Tests

## Goal

Add unit tests for the new thread state integration functionality.

## Test Files

- `src/adapters/inbound/controllers/FileWatchController.test.ts`
- `src/adapters/inbound/controllers/ThreadListController.test.ts`
- `src/application/services/PanelStateManager.test.ts`

## Test Cases

### FileWatchController Tests

```typescript
describe('FileWatchController thread support', () => {
    describe('setCurrentThread', () => {
        it('stores thread ID and patterns', () => {
            const controller = new FileWatchController();
            controller.setCurrentThread('thread-1', ['dist/**']);

            expect(controller.getCurrentThreadId()).toBe('thread-1');
        });

        it('combines global and thread patterns', () => {
            // Mock global config with ['*.log']
            const controller = new FileWatchController();
            controller.setCurrentThread('thread-1', ['dist/**']);

            // Files matching either pattern should be tracked
            expect(controller.shouldTrack(distFile)).toBe(true);
            expect(controller.shouldTrack(logFile)).toBe(true);
        });

        it('clears thread patterns when set to null', () => {
            const controller = new FileWatchController();
            controller.setCurrentThread('thread-1', ['dist/**']);
            controller.setCurrentThread(null, []);

            expect(controller.getCurrentThreadId()).toBeNull();
        });
    });

    describe('addWhitelistPattern', () => {
        it('saves to ThreadState when thread is selected', async () => {
            const mockRepo = { save: jest.fn() };
            const controller = new FileWatchController();
            controller.setThreadStateRepository(mockRepo);
            controller.setCurrentThread('thread-1', []);

            await controller.addWhitelistPattern('build/**');

            expect(mockRepo.save).toHaveBeenCalled();
        });

        it('saves to global config when no thread selected', async () => {
            const controller = new FileWatchController();
            controller.setCurrentThread(null, []);

            await controller.addWhitelistPattern('build/**');

            // Verify global config update
        });
    });
});
```

### ThreadListController Tests

```typescript
describe('ThreadListController', () => {
    describe('selectThread', () => {
        it('applies thread whitelist patterns', async () => {
            const mockFileWatch = { setCurrentThread: jest.fn() };
            const controller = new ThreadListController(
                getSessions,
                terminalGateway,
                undefined,
                undefined,
                mockFileWatch,
                commentRepository
            );

            await controller.selectThread('term-1');

            expect(mockFileWatch.setCurrentThread).toHaveBeenCalledWith(
                'term-1',
                expect.any(Array)
            );
        });

        it('filters comments by threadId', async () => {
            const mockRepo = {
                findByThreadId: jest.fn().mockResolvedValue([comment1]),
                findActive: jest.fn().mockResolvedValue([]),
            };

            const controller = new ThreadListController(
                getSessions,
                terminalGateway,
                undefined,
                undefined,
                fileWatchController,
                mockRepo
            );

            await controller.selectThread('term-1');

            expect(mockRepo.findByThreadId).toHaveBeenCalledWith('thread-id');
            expect(stateManager.setComments).toHaveBeenCalled();
        });

        it('includes legacy comments without threadId', async () => {
            const legacyComment = { id: '1', text: 'Legacy', threadId: undefined };
            const mockRepo = {
                findByThreadId: jest.fn().mockResolvedValue([]),
                findActive: jest.fn().mockResolvedValue([legacyComment]),
            };

            const controller = new ThreadListController(/*...*/);
            await controller.selectThread('term-1');

            const setCommentsCall = stateManager.setComments.mock.calls[0][0];
            expect(setCommentsCall).toContainEqual(expect.objectContaining({ text: 'Legacy' }));
        });
    });
});
```

### PanelStateManager Tests

```typescript
describe('PanelStateManager', () => {
    describe('setComments', () => {
        it('replaces all comments', () => {
            const manager = new PanelStateManager();
            manager.addComment({ id: '1', text: 'Old' });

            manager.setComments([{ id: '2', text: 'New' }]);

            expect(manager.getState().comments).toHaveLength(1);
            expect(manager.getState().comments[0].text).toBe('New');
        });

        it('triggers render', () => {
            const renderCallback = jest.fn();
            const manager = new PanelStateManager();
            manager.setRenderCallback(renderCallback);

            manager.setComments([]);

            expect(renderCallback).toHaveBeenCalled();
        });
    });
});
```

## Acceptance Criteria

- [ ] FileWatchController.setCurrentThread tests pass
- [ ] FileWatchController.addWhitelistPattern tests pass
- [ ] ThreadListController.selectThread tests pass
- [ ] PanelStateManager.setComments tests pass
- [ ] All tests run in CI pipeline
