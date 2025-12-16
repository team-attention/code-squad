import { ThreadState } from '../../../domain/entities/ThreadState';

export interface AttachToWorktreeInput {
    worktreePath: string;
    name?: string;  // Optional, defaults to branch name
    workspaceRoot: string;
}

export interface AttachToWorktreeOutput {
    threadState: ThreadState;
}

export interface IAttachToWorktreeUseCase {
    execute(input: AttachToWorktreeInput): Promise<AttachToWorktreeOutput>;
}
