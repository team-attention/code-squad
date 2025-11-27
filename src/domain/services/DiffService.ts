export interface DiffEntry {
    type: 'equal' | 'delete' | 'insert';
    line: string;
}

export class DiffService {
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
