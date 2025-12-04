export interface DeleteCommentInput {
    id: string;
}

export interface IDeleteCommentUseCase {
    execute(input: DeleteCommentInput): Promise<boolean>;
}
