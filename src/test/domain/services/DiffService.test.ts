import * as assert from 'assert';
import { DiffService } from '../../../domain/services/DiffService';

suite('DiffService', () => {
    let diffService: DiffService;

    setup(() => {
        diffService = new DiffService();
    });

    suite('parseUnifiedDiff', () => {
        test('should parse empty diff', () => {
            const result = diffService.parseUnifiedDiff('test.ts', '');
            assert.strictEqual(result.chunks.length, 0);
            assert.strictEqual(result.stats.additions, 0);
            assert.strictEqual(result.stats.deletions, 0);
        });

        test('should parse simple addition', () => {
            const diff = `@@ -1,2 +1,3 @@
 line1
+added
 line2`;
            const result = diffService.parseUnifiedDiff('test.ts', diff);
            assert.strictEqual(result.chunks.length, 1);
            assert.strictEqual(result.stats.additions, 1);
            assert.strictEqual(result.stats.deletions, 0);
        });

        test('should parse simple deletion', () => {
            const diff = `@@ -1,3 +1,2 @@
 line1
-deleted
 line2`;
            const result = diffService.parseUnifiedDiff('test.ts', diff);
            assert.strictEqual(result.chunks.length, 1);
            assert.strictEqual(result.stats.additions, 0);
            assert.strictEqual(result.stats.deletions, 1);
        });

        test('should parse mixed changes', () => {
            const diff = `@@ -1,3 +1,3 @@
 line1
-old
+new
 line3`;
            const result = diffService.parseUnifiedDiff('test.ts', diff);
            assert.strictEqual(result.chunks.length, 1);
            assert.strictEqual(result.stats.additions, 1);
            assert.strictEqual(result.stats.deletions, 1);
        });

        test('should track line numbers correctly', () => {
            const diff = `@@ -5,3 +5,4 @@
 context
-deleted
+added1
+added2
 context`;
            const result = diffService.parseUnifiedDiff('test.ts', diff);
            const chunk = result.chunks[0];

            assert.strictEqual(chunk.oldStart, 5);
            assert.strictEqual(chunk.newStart, 5);

            const deletion = chunk.lines.find(l => l.type === 'deletion');
            assert.strictEqual(deletion?.oldLineNumber, 6);

            const additions = chunk.lines.filter(l => l.type === 'addition');
            assert.strictEqual(additions[0]?.newLineNumber, 6);
            assert.strictEqual(additions[1]?.newLineNumber, 7);
        });
    });

    suite('generateUnifiedDiff', () => {
        test('should return empty for identical content', () => {
            const result = diffService.generateUnifiedDiff('same', 'same');
            assert.strictEqual(result, '');
        });

        test('should detect simple addition', () => {
            const old = 'line1\nline2';
            const newContent = 'line1\nadded\nline2';
            const result = diffService.generateUnifiedDiff(old, newContent);

            assert.ok(result.includes('+added'));
            // Note: context lines start with ' ', not '-'
            const deletions = result.split('\n').filter(l => l.startsWith('-'));
            assert.strictEqual(deletions.length, 0, 'Should have no deletions');
        });

        test('should detect simple deletion', () => {
            const old = 'line1\ndeleted\nline2';
            const newContent = 'line1\nline2';
            const result = diffService.generateUnifiedDiff(old, newContent);

            assert.ok(result.includes('-deleted'));
        });

        test('should detect modification', () => {
            const old = 'line1\nold\nline3';
            const newContent = 'line1\nnew\nline3';
            const result = diffService.generateUnifiedDiff(old, newContent);

            assert.ok(result.includes('-old'));
            assert.ok(result.includes('+new'));
        });

        test('should include context lines', () => {
            const old = 'a\nb\nc\nd\ne\nf';
            const newContent = 'a\nb\nc\nX\ne\nf';
            const result = diffService.generateUnifiedDiff(old, newContent);

            // Should have context before and after the change
            assert.ok(result.includes(' b') || result.includes(' c'));
            assert.ok(result.includes(' e') || result.includes(' f'));
        });

        test('should have correct hunk header with separate old/new line numbers', () => {
            const old = 'a\nb\nc';
            const newContent = 'a\nX\nY\nb\nc';
            const result = diffService.generateUnifiedDiff(old, newContent);

            // Header should have format @@ -oldStart,oldCount +newStart,newCount @@
            const headerMatch = result.match(/@@ -(\d+),(\d+) \+(\d+),(\d+) @@/);
            assert.ok(headerMatch, 'Should have valid hunk header');
        });
    });

    suite('generateNewFileDiff', () => {
        test('should return empty for empty content', () => {
            const result = diffService.generateNewFileDiff('');
            assert.strictEqual(result, '');
        });

        test('should handle single line', () => {
            const result = diffService.generateNewFileDiff('hello');
            assert.ok(result.includes('+hello'));
            assert.ok(result.includes('@@ -0,0 +1,1 @@'));
        });

        test('should handle multiple lines', () => {
            const result = diffService.generateNewFileDiff('a\nb\nc');
            assert.ok(result.includes('@@ -0,0 +1,3 @@'));
            assert.ok(result.includes('+a'));
            assert.ok(result.includes('+b'));
            assert.ok(result.includes('+c'));
        });

        test('should handle trailing newline correctly', () => {
            const result = diffService.generateNewFileDiff('a\nb\nc\n');
            // Should count 3 lines, not 4
            assert.ok(result.includes('@@ -0,0 +1,3 @@'));
        });

        test('should handle content with only newline', () => {
            const result = diffService.generateNewFileDiff('\n');
            // Single newline results in one empty line
            assert.ok(result.includes('@@ -0,0 +1,1 @@'));
        });
    });

    suite('generateDeletedFileDiff', () => {
        test('should return empty for empty content', () => {
            const result = diffService.generateDeletedFileDiff('');
            assert.strictEqual(result, '');
        });

        test('should handle single line', () => {
            const result = diffService.generateDeletedFileDiff('hello');
            assert.ok(result.includes('-hello'));
            assert.ok(result.includes('@@ -1,1 +0,0 @@'));
        });

        test('should handle multiple lines', () => {
            const result = diffService.generateDeletedFileDiff('a\nb\nc');
            assert.ok(result.includes('@@ -1,3 +0,0 @@'));
            assert.ok(result.includes('-a'));
            assert.ok(result.includes('-b'));
            assert.ok(result.includes('-c'));
        });

        test('should handle trailing newline correctly', () => {
            const result = diffService.generateDeletedFileDiff('a\nb\nc\n');
            // Should count 3 lines, not 4
            assert.ok(result.includes('@@ -1,3 +0,0 @@'));
        });
    });

    suite('generateStructuredDiff', () => {
        test('should return structured diff for changes', () => {
            const result = diffService.generateStructuredDiff(
                'test.ts',
                'old line',
                'new line'
            );

            assert.strictEqual(result.file, 'test.ts');
            assert.ok(result.chunks.length > 0);
            assert.strictEqual(result.stats.additions, 1);
            assert.strictEqual(result.stats.deletions, 1);
        });

        test('should return empty chunks for identical content', () => {
            const result = diffService.generateStructuredDiff(
                'test.ts',
                'same content',
                'same content'
            );

            assert.strictEqual(result.chunks.length, 0);
        });
    });

    suite('generateNewFileStructuredDiff', () => {
        test('should create structured diff for new file', () => {
            const result = diffService.generateNewFileStructuredDiff(
                'new.ts',
                'line1\nline2'
            );

            assert.strictEqual(result.file, 'new.ts');
            assert.strictEqual(result.chunks.length, 1);
            assert.strictEqual(result.stats.additions, 2);
            assert.strictEqual(result.stats.deletions, 0);
        });
    });

    suite('generateDeletedFileStructuredDiff', () => {
        test('should create structured diff for deleted file', () => {
            const result = diffService.generateDeletedFileStructuredDiff(
                'deleted.ts',
                'line1\nline2'
            );

            assert.strictEqual(result.file, 'deleted.ts');
            assert.strictEqual(result.chunks.length, 1);
            assert.strictEqual(result.stats.additions, 0);
            assert.strictEqual(result.stats.deletions, 2);
        });
    });

    suite('edge cases', () => {
        test('should handle empty old content (new file via generateUnifiedDiff)', () => {
            const result = diffService.generateUnifiedDiff('', 'new content');
            assert.ok(result.includes('+new content'));
        });

        test('should handle empty new content (deleted file via generateUnifiedDiff)', () => {
            const result = diffService.generateUnifiedDiff('old content', '');
            assert.ok(result.includes('-old content'));
        });

        test('should handle multiple separate changes', () => {
            const old = 'a\nb\nc\nd\ne\nf\ng\nh\ni\nj';
            const newContent = 'a\nX\nc\nd\ne\nf\ng\nY\ni\nj';
            const result = diffService.generateUnifiedDiff(old, newContent);

            assert.ok(result.includes('-b'));
            assert.ok(result.includes('+X'));
            assert.ok(result.includes('-h'));
            assert.ok(result.includes('+Y'));
        });

        test('should handle consecutive additions', () => {
            const old = 'a\nb';
            const newContent = 'a\nx\ny\nz\nb';
            const result = diffService.generateUnifiedDiff(old, newContent);

            assert.ok(result.includes('+x'));
            assert.ok(result.includes('+y'));
            assert.ok(result.includes('+z'));
        });

        test('should handle consecutive deletions', () => {
            const old = 'a\nx\ny\nz\nb';
            const newContent = 'a\nb';
            const result = diffService.generateUnifiedDiff(old, newContent);

            assert.ok(result.includes('-x'));
            assert.ok(result.includes('-y'));
            assert.ok(result.includes('-z'));
        });
    });
});
