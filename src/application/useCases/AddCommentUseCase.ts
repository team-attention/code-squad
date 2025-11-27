import { Comment } from '../../domain/entities/Comment';
import { ICommentRepository } from '../ports/outbound/ICommentRepository';
import { IPanelStateManager } from '../services/IPanelStateManager';
import { IAddCommentUseCase, AddCommentInput } from '../ports/inbound/IAddCommentUseCase';

export class AddCommentUseCase implements IAddCommentUseCase {
    constructor(
        private readonly commentRepository: ICommentRepository,
        private readonly panelStateManager: IPanelStateManager
    ) {}

    async execute(input: AddCommentInput): Promise<Comment> {
        const comment = Comment.create({
            file: input.file,
            line: input.line,
            endLine: input.endLine,
            text: input.text,
            codeContext: input.codeContext,
        });

        await this.commentRepository.save(comment);

        // Update panel state - triggers render
        this.panelStateManager.addComment({
            id: comment.id,
            file: comment.file,
            line: comment.line,
            endLine: comment.endLine,
            text: comment.text,
        });

        return comment;
    }
}
