import { ITerminalStatusDetector } from '../../domain/services/TerminalStatusDetector';
import { AgentStatus, AIType } from '../../domain/entities/AISession';
import { IDetectThreadStatusUseCase, StatusChangeCallback } from '../ports/inbound/IDetectThreadStatusUseCase';

interface TerminalState {
    status: AgentStatus;
    lastUpdate: number;
    idleTimer?: ReturnType<typeof setTimeout>;
}

export class DetectThreadStatusUseCase implements IDetectThreadStatusUseCase {
    private states = new Map<string, TerminalState>();
    private callbacks: StatusChangeCallback[] = [];

    // Time to wait after last working pattern before switching to idle
    private static IDLE_TIMEOUT_MS = 2000;

    constructor(private detector: ITerminalStatusDetector) {}

    processOutput(terminalId: string, aiType: AIType, output: string): void {
        const state = this.getOrCreateState(terminalId);

        // Check current output for patterns
        const detectedStatus = this.detector.detect(aiType, output);

        // Clear any pending idle timer
        if (state.idleTimer) {
            clearTimeout(state.idleTimer);
            state.idleTimer = undefined;
        }

        // waiting = user action required, show immediately
        if (detectedStatus === 'waiting') {
            if (state.status !== 'waiting') {
                state.status = 'waiting';
                state.lastUpdate = Date.now();
                this.notifyChange(terminalId, 'waiting');
            }
            return;
        }

        // working pattern found (e.g., "Esc to interrupt", spinner)
        if (detectedStatus === 'working') {
            if (state.status !== 'working') {
                state.status = 'working';
                state.lastUpdate = Date.now();
                this.notifyChange(terminalId, 'working');
            }
            // Schedule idle check - if no more working patterns, go idle
            state.idleTimer = setTimeout(() => {
                if (state.status === 'working') {
                    state.status = 'idle';
                    state.lastUpdate = Date.now();
                    this.notifyChange(terminalId, 'idle');
                }
            }, DetectThreadStatusUseCase.IDLE_TIMEOUT_MS);
            return;
        }

        // idle pattern found (explicit prompt patterns)
        if (detectedStatus === 'idle') {
            if (state.status !== 'idle') {
                state.status = 'idle';
                state.lastUpdate = Date.now();
                this.notifyChange(terminalId, 'idle');
            }
            return;
        }

        // No waiting/working/idle pattern = stay in current state or go idle
        // Only transition to idle from inactive or working (not from waiting)
        if (state.status === 'inactive' || state.status === 'working') {
            state.status = 'idle';
            state.lastUpdate = Date.now();
            this.notifyChange(terminalId, 'idle');
        }
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
