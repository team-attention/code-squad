import { ITerminalStatusDetector } from '../../domain/services/TerminalStatusDetector';
import { AgentStatus, AIType } from '../../domain/entities/AISession';
import { IDetectThreadStatusUseCase, StatusChangeCallback } from '../ports/inbound/IDetectThreadStatusUseCase';

interface TerminalState {
    status: AgentStatus;
    lastUpdate: number;
    idleTimer?: ReturnType<typeof setTimeout>;
    outputBuffer: string[];
}

export class DetectThreadStatusUseCase implements IDetectThreadStatusUseCase {
    private states = new Map<string, TerminalState>();
    private callbacks: StatusChangeCallback[] = [];

    // Time to wait after last working pattern before switching to idle
    private static IDLE_TIMEOUT_MS = 2000;
    // Max lines to keep in output buffer for pattern matching
    private static MAX_BUFFER_LINES = 20;

    constructor(private detector: ITerminalStatusDetector) {}

    processOutput(terminalId: string, aiType: AIType, output: string): void {
        const state = this.getOrCreateState(terminalId);

        // Add new output to buffer (split by lines)
        const newLines = output.split('\n').filter(line => line.trim().length > 0);
        state.outputBuffer.push(...newLines);
        // Keep only the last MAX_BUFFER_LINES
        if (state.outputBuffer.length > DetectThreadStatusUseCase.MAX_BUFFER_LINES) {
            state.outputBuffer = state.outputBuffer.slice(-DetectThreadStatusUseCase.MAX_BUFFER_LINES);
        }

        // Clear any pending idle timer
        if (state.idleTimer) {
            clearTimeout(state.idleTimer);
            state.idleTimer = undefined;
        }

        // Check CURRENT output for idle pattern (immediate signal)
        const currentStatus = this.detector.detect(aiType, output);

        // If current output has idle pattern → idle immediately
        if (currentStatus === 'idle') {
            if (state.status !== 'idle') {
                state.status = 'idle';
                state.lastUpdate = Date.now();
                this.notifyChange(terminalId, 'idle');
            }
            return;
        }

        // Check BUFFER for waiting pattern (needs historical context)
        const bufferStatus = this.detector.detectFromBuffer(aiType, state.outputBuffer);

        // waiting = user action required, show immediately
        if (bufferStatus === 'waiting') {
            if (state.status !== 'waiting') {
                state.status = 'waiting';
                state.lastUpdate = Date.now();
                this.notifyChange(terminalId, 'waiting');
            }
            return;
        }

        // Output received but no idle/waiting pattern = working
        if (state.status !== 'working') {
            state.status = 'working';
            state.lastUpdate = Date.now();
            this.notifyChange(terminalId, 'working');
        }
        // Schedule idle check - if no more output, go idle
        state.idleTimer = setTimeout(() => {
            if (state.status === 'working') {
                state.status = 'idle';
                state.lastUpdate = Date.now();
                this.notifyChange(terminalId, 'idle');
            }
        }, DetectThreadStatusUseCase.IDLE_TIMEOUT_MS);
    }

    getStatus(terminalId: string): AgentStatus {
        return this.states.get(terminalId)?.status ?? 'inactive';
    }

    onStatusChange(callback: StatusChangeCallback): void {
        this.callbacks.push(callback);
    }

    clear(terminalId: string): void {
        const state = this.states.get(terminalId);
        if (state?.idleTimer) {
            clearTimeout(state.idleTimer);
        }
        this.states.delete(terminalId);
    }

    private getOrCreateState(terminalId: string): TerminalState {
        if (!this.states.has(terminalId)) {
            this.states.set(terminalId, {
                status: 'inactive',
                lastUpdate: Date.now(),
                outputBuffer: [],
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
