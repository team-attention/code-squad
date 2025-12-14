import * as assert from 'assert';
import { TerminalStatusDetector } from '../../../domain/services/TerminalStatusDetector';

suite('TerminalStatusDetector', () => {
    let detector: TerminalStatusDetector;

    setup(() => {
        detector = new TerminalStatusDetector();
    });

    suite('detect - Claude patterns', () => {
        test('TS-1: detects waiting status from selection menu', () => {
            const output = 'Enter to select';
            const status = detector.detect('claude', output);
            assert.strictEqual(status, 'waiting');
        });

        test('TS-1.1: detects waiting status from y/n prompt', () => {
            const output = 'Do you want to proceed? (y/n)';
            const status = detector.detect('claude', output);
            assert.strictEqual(status, 'waiting');
        });

        test('TS-1.2: detects waiting status from Y/n prompt', () => {
            const output = 'Confirm [Y/n]';
            const status = detector.detect('claude', output);
            assert.strictEqual(status, 'waiting');
        });

        test('TS-1.3: detects waiting status from Tab/Arrow navigation', () => {
            const output = 'Tab/Arrow keys to navigate';
            const status = detector.detect('claude', output);
            assert.strictEqual(status, 'waiting');
        });

        test('TS-1.4: detects waiting status from question prompt', () => {
            const output = '? What file do you want to edit?';
            const status = detector.detect('claude', output);
            assert.strictEqual(status, 'waiting');
        });

        test('TS-2: detects working status from spinner', () => {
            // Various spinner characters
            const spinners = ['●', '◐', '◓', '◑', '◒', '⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
            for (const spinner of spinners) {
                const status = detector.detect('claude', `${spinner} Reading file...`);
                assert.strictEqual(status, 'working', `Failed for spinner: ${spinner}`);
            }
        });

        test('TS-2.1: detects working status from Reading message', () => {
            const output = 'Reading src/index.ts';
            const status = detector.detect('claude', output);
            assert.strictEqual(status, 'working');
        });

        test('TS-2.2: detects working status from Writing message', () => {
            const output = 'Writing src/index.ts';
            const status = detector.detect('claude', output);
            assert.strictEqual(status, 'working');
        });

        test('TS-2.3: detects working status from Searching message', () => {
            const output = 'Searching...';
            const status = detector.detect('claude', output);
            assert.strictEqual(status, 'working');
        });

        test('TS-3: detects idle status from prompt', () => {
            const output = '> ';
            const status = detector.detect('claude', output);
            assert.strictEqual(status, 'idle');
        });

        test('TS-3.1: detects idle status from INSERT mode', () => {
            const output = '-- INSERT --';
            const status = detector.detect('claude', output);
            assert.strictEqual(status, 'idle');
        });

        test('TS-3.2: detects idle status from NORMAL mode', () => {
            const output = '-- NORMAL --';
            const status = detector.detect('claude', output);
            assert.strictEqual(status, 'idle');
        });

        test('TS-3.3: detects idle status from token count', () => {
            const output = '1234 tokens';
            const status = detector.detect('claude', output);
            assert.strictEqual(status, 'idle');
        });

        test('returns inactive for unknown output', () => {
            const output = 'Some random text';
            const status = detector.detect('claude', output);
            assert.strictEqual(status, 'inactive');
        });

        test('priority: waiting takes precedence over working', () => {
            // This output contains both working and waiting patterns
            const output = '● Reading file... Do you want to proceed? (y/n)';
            const status = detector.detect('claude', output);
            assert.strictEqual(status, 'waiting');
        });

        test('priority: working takes precedence over idle', () => {
            // This output contains both working and idle patterns
            const output = '● Reading file... > ';
            const status = detector.detect('claude', output);
            assert.strictEqual(status, 'working');
        });
    });

    suite('detect - strips ANSI codes', () => {
        test('strips ANSI color codes before matching', () => {
            const output = '\x1B[32m● Reading file...\x1B[0m';
            const status = detector.detect('claude', output);
            assert.strictEqual(status, 'working');
        });

        test('strips ANSI cursor codes before matching', () => {
            const output = '\x1B[2K\x1B[1GEnter to select';
            const status = detector.detect('claude', output);
            assert.strictEqual(status, 'waiting');
        });
    });

    suite('detect - Codex patterns', () => {
        test('detects waiting status for codex (y/n)', () => {
            const output = '(y/n)';
            const status = detector.detect('codex', output);
            assert.strictEqual(status, 'waiting');
        });

        test('detects waiting status for codex Confirm', () => {
            const output = 'Confirm action?';
            const status = detector.detect('codex', output);
            assert.strictEqual(status, 'waiting');
        });

        test('detects working status from ellipsis for codex', () => {
            const output = 'Processing...';
            const status = detector.detect('codex', output);
            assert.strictEqual(status, 'working');
        });

        test('detects working status from Running for codex', () => {
            const output = 'Running command';
            const status = detector.detect('codex', output);
            assert.strictEqual(status, 'working');
        });

        test('detects idle status from send hint for codex', () => {
            const output = '⮐ send    ^J newline    ^T transcript    ^C quit';
            const status = detector.detect('codex', output);
            assert.strictEqual(status, 'idle');
        });

        test('detects idle status from welcome message for codex', () => {
            const output = 'To get started, describe a task';
            const status = detector.detect('codex', output);
            assert.strictEqual(status, 'idle');
        });

        test('detects idle status from header banner for codex', () => {
            const output = '>_ OpenAI Codex (v0.36.0)';
            const status = detector.detect('codex', output);
            assert.strictEqual(status, 'idle');
        });

        test('detects idle status from dollar prompt for codex', () => {
            const output = 'codex$ ';
            const status = detector.detect('codex', output);
            assert.strictEqual(status, 'idle');
        });
    });

    suite('detect - Gemini patterns', () => {
        test('detects waiting status for gemini (y/n)', () => {
            const output = '(y/n)';
            const status = detector.detect('gemini', output);
            assert.strictEqual(status, 'waiting');
        });

        test('detects waiting status for gemini Confirm', () => {
            const output = 'Confirm action?';
            const status = detector.detect('gemini', output);
            assert.strictEqual(status, 'waiting');
        });

        test('detects working status from ellipsis for gemini', () => {
            const output = 'Processing...';
            const status = detector.detect('gemini', output);
            assert.strictEqual(status, 'working');
        });

        test('detects working status from Thinking for gemini', () => {
            const output = 'Thinking';
            const status = detector.detect('gemini', output);
            assert.strictEqual(status, 'working');
        });

        test('detects idle status from Type your message for gemini', () => {
            const output = '> Type your message or @path/to/file';
            const status = detector.detect('gemini', output);
            assert.strictEqual(status, 'idle');
        });

        test('detects idle status from no sandbox for gemini', () => {
            const output = '~/Workspace/minder (main*)                no sandbox              auto';
            const status = detector.detect('gemini', output);
            assert.strictEqual(status, 'idle');
        });

        test('detects idle status from GEMINI.md for gemini', () => {
            const output = 'Using: - 1 GEMINI.md file';
            const status = detector.detect('gemini', output);
            assert.strictEqual(status, 'idle');
        });

        test('detects idle status from tips for gemini', () => {
            const output = 'Tips for getting started:';
            const status = detector.detect('gemini', output);
            assert.strictEqual(status, 'idle');
        });
    });

    suite('detectFromBuffer', () => {
        test('returns status from most recent matching line', () => {
            const lines = [
                'Some old output',
                '● Reading file...',
                '> ',  // Most recent - should return idle
            ];
            const status = detector.detectFromBuffer('claude', lines);
            assert.strictEqual(status, 'idle');
        });

        test('returns working if most recent line is working pattern', () => {
            const lines = [
                'Some old output',
                '> ',
                '● Reading file...',  // Most recent
            ];
            const status = detector.detectFromBuffer('claude', lines);
            assert.strictEqual(status, 'working');
        });

        test('returns inactive for empty buffer', () => {
            const status = detector.detectFromBuffer('claude', []);
            assert.strictEqual(status, 'inactive');
        });

        test('returns inactive when no pattern matches', () => {
            const lines = [
                'Some random text',
                'More random text',
            ];
            const status = detector.detectFromBuffer('claude', lines);
            assert.strictEqual(status, 'inactive');
        });

        test('handles multi-line patterns by joining recent lines', () => {
            const lines = [
                'Line 1',
                'Do you want to',
                'proceed? (y/n)',  // Pattern spans two lines
            ];
            const status = detector.detectFromBuffer('claude', lines);
            assert.strictEqual(status, 'waiting');
        });
    });
});
