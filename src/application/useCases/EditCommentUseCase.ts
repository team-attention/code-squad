import { Comment } from '../../domain/entities/Comment';
import { ICommentRepository } from '../ports/outbound/ICommentRepository';
import { EditCommentInput, IEditCommentUseCase } from '../ports/inbound/IEditCommentUseCase';

export class EditCommentUseCase implements IEditCommentUseCase {
    constructor(private readonly commentRepository: ICommentRepository) {}

    async execute(input: EditCommentInput): Promise<Comment | null> {
        const { id, text } = input;

        if (!text.trim()) {
            return null;
        }

        return this.commentRepository.update(id, text.trim());
    }
}
