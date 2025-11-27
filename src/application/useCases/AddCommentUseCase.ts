import { Comment } from '../../domain/entities/Comment';
import { ICommentRepository } from '../../domain/repositories/ICommentRepository';
import { IPanelPort } from '../ports/IPanelPort';

export interface AddCommentInput {
    file: string;
    line: number;
    endLine?: number;
    text: string;
    codeContext: string;
}

export class AddCommentUseCase {
    constructor(
        private readonly commentRepository: ICommentRepository,
        private readonly panelPort: IPanelPort
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
        this.panelPort.updateCommentAdded(comment);

        return comment;
    }
}
