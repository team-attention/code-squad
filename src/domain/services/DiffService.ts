import { DiffChunk, DiffLine, DiffResult } from '../entities/Diff';

export interface DiffEntry {
    type: 'equal' | 'delete' | 'insert';
    line: string;
}

export class DiffService {
    /**
     * Parse unified diff string (from git) into structured format
     */
    parseUnifiedDiff(file: string, diffText: string): DiffResult {
        if (!diffText || diffText.trim() === '') {
            return { file, chunks: [], stats: { additions: 0, deletions: 0 } };
        }

        const lines = diffText.split('\n');
        const chunks: DiffChunk[] = [];
        let currentChunk: DiffChunk | null = null;
        let oldLineNum = 0;
        let newLineNum = 0;
        let additions = 0;
        let deletions = 0;
        let chunkAdditions = 0;
        let chunkDeletions = 0;

        for (const line of lines) {
            // Skip git diff metadata
            if (line.startsWith('diff --git') ||
                line.startsWith('index ') ||
                line.startsWith('---') ||
                line.startsWith('+++') ||
                line.startsWith('\\')) {
                continue;
            }

            // Chunk header
            if (line.startsWith('@@')) {
                if (currentChunk) {
                    currentChunk.stats = {
                        additions: chunkAdditions,
                        deletions: chunkDeletions
                    };
                    chunks.push(currentChunk);
                }
                chunkAdditions = 0;
                chunkDeletions = 0;
                const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@(.*)/);
                if (match) {
                    oldLineNum = parseInt(match[1], 10);
                    newLineNum = parseInt(match[2], 10);
                    currentChunk = {
                        header: line,
                        oldStart: oldLineNum,
                        newStart: newLineNum,
                        lines: [],
                        stats: { additions: 0, deletions: 0 }
                    };
                }
                continue;
            }

            if (!currentChunk) continue;

            let diffLine: DiffLine;

            if (line.startsWith('+')) {
                diffLine = {
                    type: 'addition',
                    content: line.substring(1),
                    newLineNumber: newLineNum++
                };
                additions++;
                chunkAdditions++;
            } else if (line.startsWith('-')) {
                diffLine = {
                    type: 'deletion',
                    content: line.substring(1),
                    oldLineNumber: oldLineNum++
                };
                deletions++;
                chunkDeletions++;
            } else {
                diffLine = {
                    type: 'context',
                    content: line.startsWith(' ') ? line.substring(1) : line,
                    oldLineNumber: oldLineNum++,
                    newLineNumber: newLineNum++
                };
            }

            currentChunk.lines.push(diffLine);
        }

        if (currentChunk) {
            currentChunk.stats = {
                additions: chunkAdditions,
                deletions: chunkDeletions
            };
            chunks.push(currentChunk);
        }

        return { file, chunks, stats: { additions, deletions } };
    }

    /**
     * Generate structured diff from content comparison
     */
    generateStructuredDiff(file: string, oldContent: string, newContent: string): DiffResult {
        const unifiedDiff = this.generateUnifiedDiff(oldContent, newContent);
        return this.parseUnifiedDiff(file, unifiedDiff);
    }

    /**
     * Generate structured diff for a new file
     */
    generateNewFileStructuredDiff(file: string, content: string): DiffResult {
        const unifiedDiff = this.generateNewFileDiff(content);
        return this.parseUnifiedDiff(file, unifiedDiff);
    }

    generateUnifiedDiff(oldContent: string, newContent: string): string {
        if (oldContent === newContent) {
            return '';
        }

        const oldLines = oldContent.split('\n');
        const newLines = newContent.split('\n');

        const diff = this.computeDiff(oldLines, newLines);
        if (diff.length === 0) return '';

        return this.formatAsUnifiedDiff(diff);
    }

    generateNewFileDiff(content: string): string {
        if (!content) return '';
        let lines = content.split('\n');
        // Remove trailing empty string from split if content ends with newline
        if (lines.length > 0 && lines[lines.length - 1] === '') {
            lines = lines.slice(0, -1);
        }
        if (lines.length === 0) return '';
        const fakeDiff = lines.map(line => `+${line}`).join('\n');
        return `@@ -0,0 +1,${lines.length} @@ New file\n${fakeDiff}`;
    }

    generateDeletedFileDiff(content: string): string {
        if (!content) return '';
        let lines = content.split('\n');
        // Remove trailing empty string from split if content ends with newline
        if (lines.length > 0 && lines[lines.length - 1] === '') {
            lines = lines.slice(0, -1);
        }
        if (lines.length === 0) return '';
        const fakeDiff = lines.map(line => `-${line}`).join('\n');
        return `@@ -1,${lines.length} +0,0 @@ Deleted file\n${fakeDiff}`;
    }

    generateDeletedFileStructuredDiff(file: string, content: string): DiffResult {
        const unifiedDiff = this.generateDeletedFileDiff(content);
        return this.parseUnifiedDiff(file, unifiedDiff);
    }

    private formatAsUnifiedDiff(diff: DiffEntry[]): string {
        let result = '';
        let hunkOldStart = -1;
        let hunkNewStart = -1;
        let hunkLines: string[] = [];
        let oldLineNum = 1;
        let newLineNum = 1;
        let oldCount = 0;
        let newCount = 0;
        let trailingContext: string[] = [];
        const CONTEXT_LINES = 3;

        const flushHunk = () => {
            if (hunkLines.length > 0) {
                result += `@@ -${hunkOldStart},${oldCount} +${hunkNewStart},${newCount} @@\n`;
                result += hunkLines.join('\n') + '\n';
                hunkLines = [];
                hunkOldStart = -1;
                hunkNewStart = -1;
                oldCount = 0;
                newCount = 0;
                trailingContext = [];
            }
        };

        for (let i = 0; i < diff.length; i++) {
            const entry = diff[i];

            if (entry.type === 'equal') {
                if (hunkLines.length > 0) {
                    // Inside a hunk - add as trailing context
                    trailingContext.push(` ${entry.line}`);

                    // Check if we should flush (too many context lines and no more changes nearby)
                    if (trailingContext.length >= CONTEXT_LINES) {
                        // Look ahead to see if there are more changes within context range
                        let hasMoreChanges = false;
                        for (let j = i + 1; j <= i + CONTEXT_LINES && j < diff.length; j++) {
                            if (diff[j].type !== 'equal') {
                                hasMoreChanges = true;
                                break;
                            }
                        }

                        if (!hasMoreChanges) {
                            // Add trailing context and flush
                            for (const ctx of trailingContext) {
                                hunkLines.push(ctx);
                                oldCount++;
                                newCount++;
                            }
                            flushHunk();
                        } else {
                            // Keep accumulating - there are more changes ahead
                            for (const ctx of trailingContext) {
                                hunkLines.push(ctx);
                                oldCount++;
                                newCount++;
                            }
                            trailingContext = [];
                        }
                    }
                }
                oldLineNum++;
                newLineNum++;
            } else {
                // Before adding a change, flush any pending trailing context
                if (trailingContext.length > 0) {
                    for (const ctx of trailingContext) {
                        hunkLines.push(ctx);
                        oldCount++;
                        newCount++;
                    }
                    trailingContext = [];
                }

                // Start new hunk if needed, with leading context
                if (hunkOldStart === -1) {
                    hunkOldStart = oldLineNum;
                    hunkNewStart = newLineNum;

                    // Add leading context from previous equal lines
                    const leadingContextStart = Math.max(0, i - CONTEXT_LINES);
                    for (let j = leadingContextStart; j < i; j++) {
                        if (diff[j].type === 'equal') {
                            hunkLines.push(` ${diff[j].line}`);
                            oldCount++;
                            newCount++;
                            hunkOldStart--;
                            hunkNewStart--;
                        }
                    }
                }

                if (entry.type === 'delete') {
                    hunkLines.push(`-${entry.line}`);
                    oldCount++;
                    oldLineNum++;
                } else if (entry.type === 'insert') {
                    hunkLines.push(`+${entry.line}`);
                    newCount++;
                    newLineNum++;
                }
            }
        }

        // Flush any remaining hunk with trailing context
        if (hunkLines.length > 0) {
            for (const ctx of trailingContext) {
                hunkLines.push(ctx);
                oldCount++;
                newCount++;
            }
            flushHunk();
        }

        return result;
    }

    private computeDiff(oldLines: string[], newLines: string[]): DiffEntry[] {
        const result: DiffEntry[] = [];
        const lcs = this.longestCommonSubsequence(oldLines, newLines);

        let oldIdx = 0;
        let newIdx = 0;
        let lcsIdx = 0;

        while (oldIdx < oldLines.length || newIdx < newLines.length) {
            if (lcsIdx < lcs.length && oldIdx < oldLines.length && oldLines[oldIdx] === lcs[lcsIdx]) {
                if (newIdx < newLines.length && newLines[newIdx] === lcs[lcsIdx]) {
                    result.push({ type: 'equal', line: oldLines[oldIdx] });
                    oldIdx++;
                    newIdx++;
                    lcsIdx++;
                } else if (newIdx < newLines.length) {
                    result.push({ type: 'insert', line: newLines[newIdx] });
                    newIdx++;
                } else {
                    result.push({ type: 'delete', line: oldLines[oldIdx] });
                    oldIdx++;
                }
            } else if (oldIdx < oldLines.length && (lcsIdx >= lcs.length || oldLines[oldIdx] !== lcs[lcsIdx])) {
                result.push({ type: 'delete', line: oldLines[oldIdx] });
                oldIdx++;
            } else if (newIdx < newLines.length) {
                result.push({ type: 'insert', line: newLines[newIdx] });
                newIdx++;
            }
        }

        return result;
    }

    private longestCommonSubsequence(a: string[], b: string[]): string[] {
        const m = a.length;
        const n = b.length;
        const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (a[i - 1] === b[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                } else {
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                }
            }
        }

        const result: string[] = [];
        let i = m, j = n;
        while (i > 0 && j > 0) {
            if (a[i - 1] === b[j - 1]) {
                result.unshift(a[i - 1]);
                i--;
                j--;
            } else if (dp[i - 1][j] > dp[i][j - 1]) {
                i--;
            } else {
                j--;
            }
        }

        return result;
    }
}
