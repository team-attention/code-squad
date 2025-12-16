import { ThreadState } from '../../domain/entities/ThreadState';
import { IThreadStateRepository } from '../ports/outbound/IThreadStateRepository';
import { ITerminalPort } from '../ports/outbound/ITerminalPort';
import { IGitPort } from '../ports/outbound/IGitPort';
import {
    IAttachToWorktreeUseCase,
    AttachToWorktreeInput,
    AttachToWorktreeOutput,
} from '../ports/inbound/IAttachToWorktreeUseCase';

export class AttachToWorktreeUseCase implements IAttachToWorktreeUseCase {
    constructor(
        private readonly threadStateRepository: IThreadStateRepository,
        private readonly terminalPort: ITerminalPort,
        private readonly gitPort: IGitPort
    ) {}

    async execute(input: AttachToWorktreeInput): Promise<AttachToWorktreeOutput> {
        const { worktreePath, name, workspaceRoot } = input;

        // Step 1: Validate worktree
        const isValid = await this.gitPort.isValidWorktree(worktreePath, workspaceRoot);
        if (!isValid) {
            throw new Error(`Invalid git worktree at ${worktreePath}`);
        }

        // Step 2: Get branch name
        let branch: string;
        try {
            branch = await this.gitPort.getWorktreeBranch(worktreePath);
        } catch (error) {
            throw new Error(`Failed to get branch name: ${error instanceof Error ? error.message : String(error)}`);
        }

        // Step 3: Determine thread name (use provided name or default to branch)
        const threadName = name ?? branch;

        // Step 4: Create terminal in worktree directory
        const terminalId = await this.terminalPort.createTerminal(threadName, worktreePath);

        // Step 5: Create thread state
        const threadState = ThreadState.create({
            name: threadName,
            terminalId,
            workingDir: worktreePath,
            branch,
            worktreePath,
            whitelistPatterns: [],
        });

        // Step 6: Persist thread state
        await this.threadStateRepository.save(threadState);

        return { threadState };
    }
}
