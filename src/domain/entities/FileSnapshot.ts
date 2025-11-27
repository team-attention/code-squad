export interface FileSnapshotData {
    relativePath: string;
    content: string;
    capturedAt: number;
}

export class FileSnapshot {
    readonly relativePath: string;
    readonly content: string;
    readonly capturedAt: number;

    constructor(data: FileSnapshotData) {
        this.relativePath = data.relativePath;
        this.content = data.content;
        this.capturedAt = data.capturedAt;
    }

    get lines(): string[] {
        return this.content.split('\n');
    }

    static create(relativePath: string, content: string): FileSnapshot {
        return new FileSnapshot({
            relativePath,
            content,
            capturedAt: Date.now(),
        });
    }
}
