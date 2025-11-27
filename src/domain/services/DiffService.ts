import { DiffHunk, DiffLine, DiffResult } from '../entities/Diff';

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
            return { file, hunks: [], stats: { additions: 0, deletions: 0 } };
        }

        const lines = diffText.split('\n');
        const hunks: DiffHunk[] = [];
        let currentHunk: DiffHunk | null = null;
        let oldLineNum = 0;
        let newLineNum = 0;
        let additions = 0;
        let deletions = 0;

        for (const line of lines) {
            // Skip git diff metadata
            if (line.startsWith('diff --git') ||
                line.startsWith('index ') ||
                line.startsWith('---') ||
                line.startsWith('+++') ||
                line.startsWith('\\')) {
                continue;
            }

            // Hunk header
            if (line.startsWith('@@')) {
                if (currentHunk) {
                    hunks.push(currentHunk);
                }
                const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@(.*)/);
                if (match) {
                    oldLineNum = parseInt(match[1], 10);
                    newLineNum = parseInt(match[2], 10);
                    currentHunk = {
                        header: line,
                        oldStart: oldLineNum,
                        newStart: newLineNum,
                        lines: []
                    };
                }
                continue;
            }

            if (!currentHunk) continue;

            let diffLine: DiffLine;

            if (line.startsWith('+')) {
                diffLine = {
                    type: 'addition',
                    content: line.substring(1),
                    newLineNumber: newLineNum++
                };
                additions++;
            } else if (line.startsWith('-')) {
                diffLine = {
                    type: 'deletion',
                    content: line.substring(1),
                    oldLineNumber: oldLineNum++
                };
                deletions++;
            } else {
                diffLine = {
                    type: 'context',
                    content: line.startsWith(' ') ? line.substring(1) : line,
                    oldLineNumber: oldLineNum++,
                    newLineNumber: newLineNum++
                };
            }

            currentHunk.lines.push(diffLine);
        }

        if (currentHunk) {
            hunks.push(currentHunk);
        }

        return { file, hunks, stats: { additions, deletions } };
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
        const lines = content.split('\n');
        const fakeDiff = lines.map(line => `+${line}`).join('\n');
        return `@@ -0,0 +1,${lines.length} @@ New file\n${fakeDiff}`;
    }

    private formatAsUnifiedDiff(diff: DiffEntry[]): string {
        let result = '';
        let hunkStart = -1;
        let hunkLines: string[] = [];
        let oldLineNum = 1;
        let newLineNum = 1;
        let oldCount = 0;
        let newCount = 0;

        const flushHunk = () => {
            if (hunkLines.length > 0) {
                result += `@@ -${hunkStart},${oldCount} +${hunkStart},${newCount} @@\n`;
                result += hunkLines.join('\n') + '\n';
                hunkLines = [];
                oldCount = 0;
                newCount = 0;
            }
        };

        for (const entry of diff) {
            if (entry.type === 'equal') {
                if (hunkLines.length > 0) {
                    hunkLines.push(` ${entry.line}`);
                    oldCount++;
                    newCount++;

                    const contextCount = hunkLines.filter(l => l.startsWith(' ')).length;
                    if (contextCount >= 3) {
                        flushHunk();
                    }
                }
                oldLineNum++;
                newLineNum++;
            } else if (entry.type === 'delete') {
                if (hunkStart === -1) hunkStart = oldLineNum;
                hunkLines.push(`-${entry.line}`);
                oldCount++;
                oldLineNum++;
            } else if (entry.type === 'insert') {
                if (hunkStart === -1) hunkStart = newLineNum;
                hunkLines.push(`+${entry.line}`);
                newCount++;
                newLineNum++;
            }
        }

        flushHunk();
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
