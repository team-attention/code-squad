import * as fs from 'fs';
import * as path from 'path';
import { Comment, CommentData } from '../../domain/entities/Comment';
import { ICommentRepository } from '../../domain/repositories/ICommentRepository';

export class JsonCommentRepository implements ICommentRepository {
    private comments: Comment[] = [];
    private storagePath: string | undefined;

    constructor(workspaceRoot: string | undefined) {
        if (workspaceRoot) {
            const vscodeDir = path.join(workspaceRoot, '.vscode');
            if (!fs.existsSync(vscodeDir)) {
                fs.mkdirSync(vscodeDir);
            }
            this.storagePath = path.join(vscodeDir, 'sidemirror-comments.json');
            this.loadComments();
        }
    }

    async save(comment: Comment): Promise<void> {
        this.comments.push(comment);
        this.persistComments();
    }

    async findAll(): Promise<Comment[]> {
        return [...this.comments];
    }

    async findActive(): Promise<Comment[]> {
        return this.comments.filter(c => !c.isSubmitted);
    }

    async markAsSubmitted(ids: string[]): Promise<void> {
        const idSet = new Set(ids);
        this.comments.forEach(c => {
            if (idSet.has(c.id)) {
                c.markAsSubmitted();
            }
        });
        this.persistComments();
    }

    private loadComments(): void {
        if (this.storagePath && fs.existsSync(this.storagePath)) {
            try {
                const data = fs.readFileSync(this.storagePath, 'utf8');
                const parsed: CommentData[] = JSON.parse(data);
                this.comments = parsed.map(d => new Comment(d));
            } catch (e) {
                console.error('Failed to load comments', e);
            }
        }
    }

    private persistComments(): void {
        if (this.storagePath) {
            try {
                const data = this.comments.map(c => c.toData());
                fs.writeFileSync(this.storagePath, JSON.stringify(data, null, 2));
            } catch (e) {
                console.error('Failed to save comments', e);
            }
        }
    }
}
