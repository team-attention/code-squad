import { Comment } from '../../../domain/entities/Comment';

export interface EditCommentInput {
    id: string;
    text: string;
}

export interface IEditCommentUseCase {
    execute(input: EditCommentInput): Promise<Comment | null>;
}
