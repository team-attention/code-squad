import { ITerminalStatusDetector } from '../../domain/services/TerminalStatusDetector';
import { AgentStatus, AIType } from '../../domain/entities/AISession';
import { IDetectThreadStatusUseCase, StatusChangeCallback } from '../ports/inbound/IDetectThreadStatusUseCase';

interface TerminalState {
    status: AgentStatus;
    buffer: string[];
    lastUpdate: number;
    debounceTimer?: ReturnType<typeof setTimeout>;
}

export class DetectThreadStatusUseCase implements IDetectThreadStatusUseCase {
    private states = new Map<string, TerminalState>();
    private callbacks: StatusChangeCallback[] = [];

    private static DEBOUNCE_MS = 200;
    private static BUFFER_LINES = 10;

    constructor(private detector: ITerminalStatusDetector) {}

    processOutput(terminalId: string, aiType: AIType, output: string): void {
        const state = this.getOrCreateState(terminalId);

        // Add new lines to buffer
        const newLines = output.split('\n');
        state.buffer.push(...newLines);
        state.buffer = state.buffer.slice(-DetectThreadStatusUseCase.BUFFER_LINES);

        // Debounce status detection
        if (state.debounceTimer) {
            clearTimeout(state.debounceTimer);
        }

        state.debounceTimer = setTimeout(() => {
            const detectedStatus = this.detector.detectFromBuffer(aiType, state.buffer);

            // Only update if we detected a meaningful status (not 'inactive')
            // Once we have a real status, don't revert to 'inactive' -
            // the session is active until explicitly cleared
            if (detectedStatus !== 'inactive' && detectedStatus !== state.status) {
                state.status = detectedStatus;
                state.lastUpdate = Date.now();
                this.notifyChange(terminalId, detectedStatus);
            }
        }, DetectThreadStatusUseCase.DEBOUNCE_MS);
    }

    getStatus(terminalId: string): AgentStatus {
        return this.states.get(terminalId)?.status ?? 'inactive';
    }

    onStatusChange(callback: StatusChangeCallback): void {
        this.callbacks.push(callback);
    }

    clear(terminalId: string): void {
        const state = this.states.get(terminalId);
        if (state?.debounceTimer) {
            clearTimeout(state.debounceTimer);
        }
        this.states.delete(terminalId);
    }

    private getOrCreateState(terminalId: string): TerminalState {
        if (!this.states.has(terminalId)) {
            this.states.set(terminalId, {
                // Start as 'working' since we're processing output (AI is active)
                status: 'working',
                buffer: [],
                lastUpdate: Date.now(),
            });
        }
        return this.states.get(terminalId)!;
    }

    private notifyChange(terminalId: string, status: AgentStatus): void {
        for (const callback of this.callbacks) {
            callback(terminalId, status);
        }
    }
}
