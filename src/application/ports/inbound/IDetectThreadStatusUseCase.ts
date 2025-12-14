import { AgentStatus, AIType } from '../../../domain/entities/AISession';

export interface StatusChangeCallback {
    (terminalId: string, status: AgentStatus): void;
}

export interface IDetectThreadStatusUseCase {
    processOutput(terminalId: string, aiType: AIType, output: string): void;
    getStatus(terminalId: string): AgentStatus;
    onStatusChange(callback: StatusChangeCallback): void;
    clear(terminalId: string): void;
}
