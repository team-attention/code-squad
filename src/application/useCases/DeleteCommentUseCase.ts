import { ICommentRepository } from '../ports/outbound/ICommentRepository';
import { DeleteCommentInput, IDeleteCommentUseCase } from '../ports/inbound/IDeleteCommentUseCase';

export class DeleteCommentUseCase implements IDeleteCommentUseCase {
    constructor(private readonly commentRepository: ICommentRepository) {}

    async execute(input: DeleteCommentInput): Promise<boolean> {
        const { id } = input;
        return this.commentRepository.delete(id);
    }
}
