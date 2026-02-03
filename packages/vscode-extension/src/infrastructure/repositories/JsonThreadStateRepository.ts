import * as fs from 'fs';
import * as path from 'path';
import {
    ThreadState,
    ThreadStateData,
    IThreadStateRepository,
} from '@code-squad/core';

export class JsonThreadStateRepository implements IThreadStateRepository {
    private threads: ThreadState[] = [];
    private storagePath: string | undefined;

    constructor(workspaceRoot: string | undefined) {
        if (workspaceRoot) {
            const vscodeDir = path.join(workspaceRoot, '.vscode');
            if (!fs.existsSync(vscodeDir)) {
                fs.mkdirSync(vscodeDir);
            }
            this.storagePath = path.join(vscodeDir, 'code-squad-threads.json');
            this.loadThreads();
        }
    }

    async save(state: ThreadState): Promise<void> {
        const existingIndex = this.threads.findIndex(t => t.threadId === state.threadId);
        if (existingIndex !== -1) {
            this.threads[existingIndex] = state;
        } else {
            this.threads.push(state);
        }
        this.persistThreads();
    }

    async findAll(): Promise<ThreadState[]> {
        return [...this.threads];
    }

    async findById(threadId: string): Promise<ThreadState | null> {
        return this.threads.find(t => t.threadId === threadId) ?? null;
    }

    async findByTerminalId(terminalId: string): Promise<ThreadState | null> {
        return this.threads.find(t => t.terminalId === terminalId) ?? null;
    }

    async delete(threadId: string): Promise<boolean> {
        const index = this.threads.findIndex(t => t.threadId === threadId);
        if (index === -1) {
            return false;
        }

        this.threads.splice(index, 1);
        this.persistThreads();
        return true;
    }

    async updateWhitelist(threadId: string, patterns: string[]): Promise<void> {
        const thread = this.threads.find(t => t.threadId === threadId);
        if (!thread) {
            return;
        }

        // Clear existing patterns and add new ones
        const currentPatterns = thread.whitelistPatterns;
        for (const pattern of currentPatterns) {
            thread.removeWhitelistPattern(pattern);
        }
        for (const pattern of patterns) {
            thread.addWhitelistPattern(pattern);
        }

        this.persistThreads();
    }

    private loadThreads(): void {
        if (!this.storagePath || !fs.existsSync(this.storagePath)) {
            return;
        }

        try {
            const data = fs.readFileSync(this.storagePath, 'utf8');
            const parsed: ThreadStateData[] = JSON.parse(data);
            this.threads = parsed.map(d => ThreadState.fromData(d));
        } catch (e) {
            console.error('[Code Squad] Failed to load threads', e);
        }
    }

    private persistThreads(): void {
        if (this.storagePath) {
            try {
                const data = this.threads.map(t => t.toData());
                fs.writeFileSync(this.storagePath, JSON.stringify(data, null, 2));
            } catch (e) {
                console.error('[Code Squad] Failed to save threads', e);
            }
        }
    }
}
