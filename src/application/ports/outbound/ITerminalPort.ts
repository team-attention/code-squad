export type TerminalActivityCallback = (terminalId: string, hasActivity: boolean) => void;

export interface ITerminalPort {
    sendText(terminalId: string, text: string): void;
    showTerminal(terminalId: string): void;
    createTerminal(name: string, cwd?: string): Promise<string>;
    /**
     * Register a callback to receive terminal activity notifications.
     * Called with hasActivity=true when terminal is writing output (AI running).
     * Called with hasActivity=false after a period of inactivity (AI idle).
     */
    onTerminalActivity(callback: TerminalActivityCallback): void;
}
