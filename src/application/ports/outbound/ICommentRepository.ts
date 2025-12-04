import { Comment } from '../../../domain/entities/Comment';

export interface ICommentRepository {
    save(comment: Comment): Promise<void>;
    findAll(): Promise<Comment[]>;
    findActive(): Promise<Comment[]>;
    markAsSubmitted(ids: string[]): Promise<void>;
    update(id: string, text: string): Promise<Comment | null>;
    delete(id: string): Promise<boolean>;
}
