import { Comment } from '../entities/Comment';

export interface ICommentRepository {
    save(comment: Comment): Promise<void>;
    findAll(): Promise<Comment[]>;
    findActive(): Promise<Comment[]>;
    markAsSubmitted(ids: string[]): Promise<void>;
}
