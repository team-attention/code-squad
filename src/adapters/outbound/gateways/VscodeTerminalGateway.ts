import * as vscode from 'vscode';
import { ITerminalPort } from '../../../application/ports/outbound/ITerminalPort';

export class VscodeTerminalGateway implements ITerminalPort {
    private terminals = new Map<string, vscode.Terminal>();
    private terminalToId = new Map<vscode.Terminal, string>();

    registerTerminal(id: string, terminal: vscode.Terminal): void {
        this.terminals.set(id, terminal);
        this.terminalToId.set(terminal, id);
    }

    unregisterTerminal(id: string): void {
        const terminal = this.terminals.get(id);
        if (terminal) {
            this.terminalToId.delete(terminal);
        }
        this.terminals.delete(id);
    }

    getTerminal(id: string): vscode.Terminal | undefined {
        return this.terminals.get(id);
    }

    /**
     * Get terminal ID from terminal object.
     * Returns undefined if terminal is not registered.
     */
    getTerminalId(terminal: vscode.Terminal): string | undefined {
        return this.terminalToId.get(terminal);
    }

    sendText(terminalId: string, text: string): void {
        const terminal = this.terminals.get(terminalId);
        if (terminal) {
            terminal.sendText(text, false);
            vscode.commands.executeCommand('workbench.action.terminal.sendSequence', {
                text: '\r'
            });
        }
    }

    showTerminal(terminalId: string): void {
        const terminal = this.terminals.get(terminalId);
        if (terminal) {
            terminal.show();
        }
    }

    async createTerminal(name: string, cwd?: string): Promise<string> {
        const terminal = vscode.window.createTerminal({
            name,
            cwd,
            location: { viewColumn: vscode.ViewColumn.One },
        });
        terminal.show();

        const processId = await terminal.processId;
        const terminalId = processId?.toString() ?? `terminal-${Date.now()}`;

        this.registerTerminal(terminalId, terminal);

        return terminalId;
    }
}
