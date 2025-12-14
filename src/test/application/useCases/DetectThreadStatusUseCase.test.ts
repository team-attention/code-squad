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

    suite('processOutput - activity-based detection', () => {
        test('immediately sets to working when output received', (done) => {
            const statuses: AgentStatus[] = [];
            useCase.onStatusChange((_terminalId, status) => {
                statuses.push(status);
            });

            useCase.processOutput('terminal-1', 'claude', 'Some output');

            // Should immediately notify working status
            assert.strictEqual(statuses.length, 1);
            assert.strictEqual(statuses[0], 'working');
            assert.strictEqual(useCase.getStatus('terminal-1'), 'working');
            done();
        });

        test('transitions to idle immediately when prompt detected', (done) => {
            const statuses: AgentStatus[] = [];
            useCase.onStatusChange((_terminalId, status) => {
                statuses.push(status);
            });

            // Send output with prompt - should detect idle immediately from buffer
            useCase.processOutput('terminal-1', 'claude', '> ');

            // Idle pattern detected immediately, no debounce needed
            assert.strictEqual(statuses.length, 1);
            assert.strictEqual(statuses[0], 'idle');
            assert.strictEqual(useCase.getStatus('terminal-1'), 'idle');
            done();
        });

        test('stays working if output continues', (done) => {
            const statuses: AgentStatus[] = [];
            useCase.onStatusChange((_terminalId, status) => {
                statuses.push(status);
            });

            // Send rapid outputs
            useCase.processOutput('terminal-1', 'claude', 'Reading...');
            setTimeout(() => {
                useCase.processOutput('terminal-1', 'claude', 'Writing...');
            }, 100);
            setTimeout(() => {
                useCase.processOutput('terminal-1', 'claude', 'Done');
            }, 200);

            // Wait a bit and check status
            setTimeout(() => {
                // Should only have one working notification (initial)
                assert.strictEqual(statuses.length, 1);
                assert.strictEqual(statuses[0], 'working');
                done();
            }, 350);
        });

        test('detects waiting status from y/n prompt immediately', (done) => {
            const statuses: AgentStatus[] = [];
            useCase.onStatusChange((_terminalId, status) => {
                statuses.push(status);
            });

            useCase.processOutput('terminal-1', 'claude', 'Do you want to proceed? (y/n)');

            // waiting should be detected immediately from buffer
            assert.strictEqual(statuses.length, 1);
            assert.strictEqual(statuses[0], 'waiting');
            assert.strictEqual(useCase.getStatus('terminal-1'), 'waiting');
            done();
        });
    });

    suite('getStatus', () => {
        test('returns inactive for unknown terminal', () => {
            const status = useCase.getStatus('unknown-terminal');
            assert.strictEqual(status, 'inactive');
        });
    });

    suite('onStatusChange', () => {
        test('notifies multiple callbacks', (done) => {
            let count = 0;

            useCase.onStatusChange(() => count++);
            useCase.onStatusChange(() => count++);

            useCase.processOutput('terminal-1', 'claude', 'Some output');

            // Should immediately notify both callbacks
            assert.strictEqual(count, 2);
            done();
        });
    });

    suite('clear', () => {
        test('removes terminal state', (done) => {
            useCase.processOutput('terminal-1', 'claude', 'Some output');

            assert.strictEqual(useCase.getStatus('terminal-1'), 'working');

            useCase.clear('terminal-1');

            assert.strictEqual(useCase.getStatus('terminal-1'), 'inactive');
            done();
        });

        test('clears pending debounce timer', (done) => {
            let changeCount = 0;
            useCase.onStatusChange(() => changeCount++);

            // Send non-pattern output to trigger working state with timer
            useCase.processOutput('terminal-1', 'claude', 'Some random output');

            // Clear before debounce fires
            useCase.clear('terminal-1');

            setTimeout(() => {
                // Only the initial 'working' notification, no 'idle' after clear
                assert.strictEqual(changeCount, 1);
                done();
            }, 2500);
        });
    });

    suite('buffer management', () => {
        test('keeps only last 20 lines in buffer', (done) => {
            // Send 25 lines of output
            for (let i = 0; i < 25; i++) {
                useCase.processOutput('terminal-1', 'claude', `Line ${i}`);
            }

            // Then send a prompt that should be detected
            useCase.processOutput('terminal-1', 'claude', '> ');

            setTimeout(() => {
                assert.strictEqual(useCase.getStatus('terminal-1'), 'idle');
                done();
            }, 600);
        });

        test('detects waiting from buffer when prompt arrives in separate chunk', (done) => {
            const statuses: AgentStatus[] = [];
            useCase.onStatusChange((_terminalId, status) => {
                statuses.push(status);
            });

            // Simulate Claude permission dialog arriving in chunks
            // First chunk: the question and options
            useCase.processOutput('terminal-1', 'claude', 'Do you want to make this edit to README.md?');
            useCase.processOutput('terminal-1', 'claude', '1. Yes');
            useCase.processOutput('terminal-1', 'claude', '2. Yes, allow all edits during this session');
            // Last chunk: just the cancel hint (no waiting pattern by itself)
            useCase.processOutput('terminal-1', 'claude', 'Esc to cancel');

            // Should detect waiting from buffer (Do you want to)
            assert.strictEqual(useCase.getStatus('terminal-1'), 'waiting');
            done();
        });

        test('transitions from waiting to idle when prompt appears in current output', (done) => {
            const statuses: AgentStatus[] = [];
            useCase.onStatusChange((_terminalId, status) => {
                statuses.push(status);
            });

            // First: permission dialog
            useCase.processOutput('terminal-1', 'claude', 'Do you want to proceed? (y/n)');
            assert.strictEqual(useCase.getStatus('terminal-1'), 'waiting');

            // User answers, new prompt appears in CURRENT output
            useCase.processOutput('terminal-1', 'claude', '> ');

            // Should now be idle (prompt detected from current output)
            assert.strictEqual(useCase.getStatus('terminal-1'), 'idle');
            done();
        });

        test('Gemini idle prompt detected from current output', (done) => {
            const statuses: AgentStatus[] = [];
            useCase.onStatusChange((_terminalId, status) => {
                statuses.push(status);
            });

            // Simulate Gemini output sequence
            useCase.processOutput('terminal-1', 'gemini', '+ Okay, I see the top-level directories.');
            assert.strictEqual(useCase.getStatus('terminal-1'), 'working');

            // Idle prompt in current output
            useCase.processOutput('terminal-1', 'gemini', '> Type your message or @path/to/file');
            assert.strictEqual(useCase.getStatus('terminal-1'), 'idle');
            done();
        });

        test('transitions to working when output has no pattern', (done) => {
            // Start with idle
            useCase.processOutput('terminal-1', 'claude', '> ');
            assert.strictEqual(useCase.getStatus('terminal-1'), 'idle');

            // AI starts working - output without idle pattern
            useCase.processOutput('terminal-1', 'claude', 'Reading file...');
            assert.strictEqual(useCase.getStatus('terminal-1'), 'working');
            done();
        });
    });
});
