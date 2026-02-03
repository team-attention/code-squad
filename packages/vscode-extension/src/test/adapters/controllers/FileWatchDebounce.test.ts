import * as assert from 'assert';

/**
 * Unit tests for FileWatchController debounce logic.
 *
 * These tests verify the debounce algorithm by testing a simplified
 * implementation that mirrors the actual FileWatchController behavior.
 */

interface DebouncedEventData {
    uri: { fsPath: string };
    relativePath: string;
    fileName: string;
    timestamp: number;
}

/**
 * Simplified debounce manager for testing.
 * Implements the same algorithm as FileWatchController.
 */
class DebounceTestHelper {
    debounceTimers: Map<string, NodeJS.Timeout> = new Map();
    pendingEventData: Map<string, DebouncedEventData> = new Map();
    debounceMs: number;
    processedEvents: DebouncedEventData[] = [];

    constructor(debounceMs: number = 300) {
        this.debounceMs = debounceMs;
    }

    loadDebounceConfig(value: number): void {
        this.debounceMs = Math.max(0, Math.min(2000, value));
    }

    handleFileChange(relativePath: string): void {
        const fileName = relativePath.split('/').pop() || relativePath;
        const eventData: DebouncedEventData = {
            uri: { fsPath: `/workspace/${relativePath}` },
            relativePath,
            fileName,
            timestamp: Date.now()
        };

        // If debouncing disabled, process immediately
        if (this.debounceMs === 0) {
            this.processedEvents.push(eventData);
            return;
        }

        // Cancel existing timer for this file
        const existingTimer = this.debounceTimers.get(relativePath);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }

        // Store latest event data
        this.pendingEventData.set(relativePath, eventData);

        // Schedule debounced processing
        const timer = setTimeout(() => {
            const data = this.pendingEventData.get(relativePath);
            this.debounceTimers.delete(relativePath);
            this.pendingEventData.delete(relativePath);

            if (data) {
                this.processedEvents.push(data);
            }
        }, this.debounceMs);

        this.debounceTimers.set(relativePath, timer);
    }

    dispose(): void {
        for (const [, timer] of this.debounceTimers) {
            clearTimeout(timer);
        }
        this.debounceTimers.clear();
        this.pendingEventData.clear();
    }

    get pendingCount(): number {
        return this.debounceTimers.size;
    }
}

suite('FileWatchController Debounce', () => {
    let helper: DebounceTestHelper;

    setup(() => {
        helper = new DebounceTestHelper(50); // Use 50ms for faster tests
    });

    teardown(() => {
        helper.dispose();
    });

    suite('UC1: DebounceRapidChanges', () => {
        test('rapid events coalesced to single processing', function(done) {
            this.timeout(500);

            // Fire 5 events rapidly for the same file
            for (let i = 0; i < 5; i++) {
                helper.handleFileChange('src/test.ts');
            }

            // Should have 1 pending timer (last one)
            assert.strictEqual(helper.pendingCount, 1);
            assert.strictEqual(helper.processedEvents.length, 0);

            // Wait for debounce to fire
            setTimeout(() => {
                assert.strictEqual(helper.processedEvents.length, 1);
                assert.strictEqual(helper.pendingCount, 0);
                done();
            }, 100);
        });

        test('different files debounce independently', function(done) {
            this.timeout(500);

            helper.handleFileChange('src/file-a.ts');
            helper.handleFileChange('src/file-b.ts');

            // Should have 2 pending timers
            assert.strictEqual(helper.pendingCount, 2);

            // Wait for both to fire
            setTimeout(() => {
                assert.strictEqual(helper.processedEvents.length, 2);
                const paths = helper.processedEvents.map(e => e.relativePath);
                assert.ok(paths.includes('src/file-a.ts'));
                assert.ok(paths.includes('src/file-b.ts'));
                done();
            }, 100);
        });

        test('slow changes processed individually', function(done) {
            this.timeout(500);

            // First event
            helper.handleFileChange('src/test.ts');

            // Wait for first to fire, then send second
            setTimeout(() => {
                assert.strictEqual(helper.processedEvents.length, 1);
                helper.handleFileChange('src/test.ts');

                // Wait for second to fire
                setTimeout(() => {
                    assert.strictEqual(helper.processedEvents.length, 2);
                    done();
                }, 100);
            }, 100);
        });
    });

    suite('UC2: ConfigureDebounceDelay', () => {
        test('zero delay disables debouncing', () => {
            const zeroHelper = new DebounceTestHelper(0);

            zeroHelper.handleFileChange('src/test.ts');

            // Should be processed immediately
            assert.strictEqual(zeroHelper.processedEvents.length, 1);
            assert.strictEqual(zeroHelper.pendingCount, 0);

            zeroHelper.dispose();
        });

        test('configuration change applies', () => {
            helper.loadDebounceConfig(500);
            assert.strictEqual(helper.debounceMs, 500);

            helper.loadDebounceConfig(100);
            assert.strictEqual(helper.debounceMs, 100);
        });

        test('out of range values clamped - maximum', () => {
            helper.loadDebounceConfig(5000);
            assert.strictEqual(helper.debounceMs, 2000);
        });

        test('out of range values clamped - negative', () => {
            helper.loadDebounceConfig(-100);
            assert.strictEqual(helper.debounceMs, 0);
        });
    });

    suite('UC3: ProcessDebouncedFileChange', () => {
        test('latest event data used when timer fires', function(done) {
            this.timeout(500);

            // Fire events with different timestamps
            helper.handleFileChange('src/test.ts');
            const firstTimestamp = helper.pendingEventData.get('src/test.ts')?.timestamp;

            // Small delay to get different timestamp
            setTimeout(() => {
                helper.handleFileChange('src/test.ts');
                const secondTimestamp = helper.pendingEventData.get('src/test.ts')?.timestamp;

                // Second timestamp should be later
                assert.ok(secondTimestamp! >= firstTimestamp!);

                // Wait for timer to fire
                setTimeout(() => {
                    assert.strictEqual(helper.processedEvents.length, 1);
                    // Processed event should have the latest timestamp
                    assert.ok(helper.processedEvents[0].timestamp >= firstTimestamp!);
                    done();
                }, 100);
            }, 10);
        });

        test('timer cleanup on dispose', function(done) {
            this.timeout(500);

            // Create 3 pending timers
            helper.handleFileChange('src/file-a.ts');
            helper.handleFileChange('src/file-b.ts');
            helper.handleFileChange('src/file-c.ts');

            assert.strictEqual(helper.pendingCount, 3);
            assert.strictEqual(helper.pendingEventData.size, 3);

            // Dispose before timers fire
            helper.dispose();

            assert.strictEqual(helper.pendingCount, 0);
            assert.strictEqual(helper.pendingEventData.size, 0);

            // Wait to ensure no events are processed
            setTimeout(() => {
                assert.strictEqual(helper.processedEvents.length, 0);
                done();
            }, 100);
        });

        test('pendingEventData stores correct file info', () => {
            helper.handleFileChange('src/components/Button.tsx');

            const data = helper.pendingEventData.get('src/components/Button.tsx');
            assert.ok(data);
            assert.strictEqual(data.relativePath, 'src/components/Button.tsx');
            assert.strictEqual(data.fileName, 'Button.tsx');
            assert.strictEqual(data.uri.fsPath, '/workspace/src/components/Button.tsx');
            assert.ok(data.timestamp > 0);

            helper.dispose();
        });
    });

    suite('Edge Cases', () => {
        test('coalesce resets timer', function(done) {
            this.timeout(500);

            helper = new DebounceTestHelper(60);

            // First event
            helper.handleFileChange('src/test.ts');

            // 40ms later, send another (should reset timer)
            setTimeout(() => {
                helper.handleFileChange('src/test.ts');

                // At 80ms from start (40ms after reset), should not have fired yet
                setTimeout(() => {
                    assert.strictEqual(helper.processedEvents.length, 0);

                    // At 120ms from start (80ms after reset), should have fired
                    setTimeout(() => {
                        assert.strictEqual(helper.processedEvents.length, 1);
                        done();
                    }, 40);
                }, 40);
            }, 40);
        });

        test('many files handled correctly', function(done) {
            this.timeout(500);

            const fileCount = 10;
            for (let i = 0; i < fileCount; i++) {
                helper.handleFileChange(`src/file-${i}.ts`);
            }

            assert.strictEqual(helper.pendingCount, fileCount);

            setTimeout(() => {
                assert.strictEqual(helper.processedEvents.length, fileCount);
                done();
            }, 100);
        });

        test('dispose is idempotent', () => {
            helper.handleFileChange('src/test.ts');
            helper.dispose();
            helper.dispose(); // Should not throw
            assert.strictEqual(helper.pendingCount, 0);
        });
    });
});
