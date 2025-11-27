export type AIType = 'claude' | 'codex';

export interface AISessionData {
    type: AIType;
    terminalId: string;
    startTime: number;
}

export class AISession {
    readonly type: AIType;
    readonly terminalId: string;
    readonly startTime: number;

    constructor(data: AISessionData) {
        this.type = data.type;
        this.terminalId = data.terminalId;
        this.startTime = data.startTime;
    }

    get displayName(): string {
        return this.type === 'claude' ? 'Claude' : 'Codex';
    }

    static create(type: AIType, terminalId: string): AISession {
        return new AISession({
            type,
            terminalId,
            startTime: Date.now(),
        });
    }
}
