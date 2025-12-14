import * as assert from 'assert';
import { DetectThreadStatusUseCase } from '../../../application/useCases/DetectThreadStatusUseCase';
import { TerminalStatusDetector } from '../../../domain/services/TerminalStatusDetector';
import { AgentStatus } from '../../../domain/entities/AISession';

suite('DetectThreadStatusUseCase', () => {
    let useCase: DetectThreadStatusUseCase;
    let detector: TerminalStatusDetector;

    setup(() => {
        detector = new TerminalStatusDetector();
        useCase = new DetectThreadStatusUseCase(detector);
    });

    teardown(() => {
        useCase.clear('terminal-1');
    });

    suite('processOutput', () => {
        test('initial state is working when first output is processed', (done) => {
            useCase.processOutput('terminal-1', 'claude', 'Some output');

            // Wait for debounce
            setTimeout(() => {
                const status = useCase.getStatus('terminal-1');
                assert.strictEqual(status, 'working');
                done();
            }, 250);
        });

        test('TS-4: debounces rapid status changes', (done) => {
            let changeCount = 0;
            useCase.onStatusChange(() => {
                changeCount++;
            });

            // Rapid fire multiple outputs
            useCase.processOutput('terminal-1', 'claude', '● Reading...');
            useCase.processOutput('terminal-1', 'claude', '● Writing...');
            useCase.processOutput('terminal-1', 'claude', '● Searching...');
            useCase.processOutput('terminal-1', 'claude', 'Enter to select');  // waiting

            // Wait for debounce
            setTimeout(() => {
                // Should only have one status change (to waiting)
                // because all intermediate outputs were debounced
                assert.strictEqual(changeCount, 1);
                assert.strictEqual(useCase.getStatus('terminal-1'), 'waiting');
                done();
            }, 250);
        });

        test('does not revert to inactive once a status is detected', (done) => {
            const statuses: AgentStatus[] = [];
            useCase.onStatusChange((_terminalId, status) => {
                statuses.push(status);
            });

            // First, detect waiting status
            useCase.processOutput('terminal-1', 'claude', 'Enter to select');

            setTimeout(() => {
                // Then send output that doesn't match any pattern
                useCase.processOutput('terminal-1', 'claude', 'random text with no pattern');

                setTimeout(() => {
                    // Status should still be waiting, not reverted to inactive
                    assert.strictEqual(useCase.getStatus('terminal-1'), 'waiting');
                    // Only one status change should have occurred
                    assert.strictEqual(statuses.length, 1);
                    assert.strictEqual(statuses[0], 'waiting');
                    done();
                }, 250);
            }, 250);
        });

        test('updates status when a new valid pattern is detected', (done) => {
            const statuses: AgentStatus[] = [];
            useCase.onStatusChange((_terminalId, status) => {
                statuses.push(status);
            });

            // Detect waiting status
            useCase.processOutput('terminal-1', 'claude', 'Enter to select');

            setTimeout(() => {
                // Then detect idle status
                useCase.processOutput('terminal-1', 'claude', '> ');

                setTimeout(() => {
                    assert.strictEqual(useCase.getStatus('terminal-1'), 'idle');
                    assert.strictEqual(statuses.length, 2);
                    assert.strictEqual(statuses[0], 'waiting');
                    assert.strictEqual(statuses[1], 'idle');
                    done();
                }, 250);
            }, 250);
        });
    });

    suite('getStatus', () => {
        test('returns inactive for unknown terminal', () => {
            const status = useCase.getStatus('unknown-terminal');
            assert.strictEqual(status, 'inactive');
        });
    });

    suite('onStatusChange', () => {
        test('notifies callback on status change', (done) => {
            let notifiedTerminalId = '';
            let notifiedStatus: AgentStatus = 'inactive';

            useCase.onStatusChange((terminalId, status) => {
                notifiedTerminalId = terminalId;
                notifiedStatus = status;
            });

            useCase.processOutput('terminal-1', 'claude', 'Enter to select');

            setTimeout(() => {
                assert.strictEqual(notifiedTerminalId, 'terminal-1');
                assert.strictEqual(notifiedStatus, 'waiting');
                done();
            }, 250);
        });

        test('notifies multiple callbacks', (done) => {
            let count = 0;

            useCase.onStatusChange(() => count++);
            useCase.onStatusChange(() => count++);

            useCase.processOutput('terminal-1', 'claude', 'Enter to select');

            setTimeout(() => {
                assert.strictEqual(count, 2);
                done();
            }, 250);
        });
    });

    suite('clear', () => {
        test('removes terminal state', (done) => {
            useCase.processOutput('terminal-1', 'claude', 'Enter to select');

            setTimeout(() => {
                assert.strictEqual(useCase.getStatus('terminal-1'), 'waiting');

                useCase.clear('terminal-1');

                assert.strictEqual(useCase.getStatus('terminal-1'), 'inactive');
                done();
            }, 250);
        });

        test('clears pending debounce timer', (done) => {
            let changeCount = 0;
            useCase.onStatusChange(() => changeCount++);

            useCase.processOutput('terminal-1', 'claude', 'Enter to select');

            // Clear before debounce fires
            useCase.clear('terminal-1');

            setTimeout(() => {
                // No status change should have occurred
                assert.strictEqual(changeCount, 0);
                done();
            }, 250);
        });
    });

    suite('buffer management', () => {
        test('keeps only last 10 lines in buffer', (done) => {
            // Send 15 lines of output
            for (let i = 0; i < 15; i++) {
                useCase.processOutput('terminal-1', 'claude', `Line ${i}`);
            }

            // Then send a pattern that should be detected
            useCase.processOutput('terminal-1', 'claude', 'Enter to select');

            setTimeout(() => {
                assert.strictEqual(useCase.getStatus('terminal-1'), 'waiting');
                done();
            }, 250);
        });
    });
});
