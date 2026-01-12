# Task 3: Add Terminal Output Stream Reading

## Goal

Extend `VscodeTerminalGateway` to read terminal output using `TerminalShellExecution.read()` API for status detection.

## Files

- `src/adapters/outbound/gateways/VscodeTerminalGateway.ts` (modify)
- `src/application/ports/outbound/ITerminalPort.ts` (modify)

## Implementation

### Update ITerminalPort

```typescript
export type TerminalActivityCallback = (terminalId: string, hasActivity: boolean) => void;
export type TerminalOutputCallback = (terminalId: string, data: string) => void;

export interface ITerminalPort {
    sendText(terminalId: string, text: string): void;
    showTerminal(terminalId: string): void;
    createTerminal(name: string, cwd?: string): Promise<string>;
    onTerminalActivity(callback: TerminalActivityCallback): void;
    onTerminalOutput(callback: TerminalOutputCallback): void;  // NEW
}
```

### Update VscodeTerminalGateway

```typescript
export class VscodeTerminalGateway implements ITerminalPort {
    private outputCallbacks: TerminalOutputCallback[] = [];

    constructor() {
        // Existing activity listeners...

        // Add output stream reading
        this.disposables.push(
            vscode.window.onDidStartTerminalShellExecution(async (e) => {
                const terminalId = this.terminalToId.get(e.terminal);
                if (terminalId) {
                    this.setActivity(terminalId, true);
                    // Read terminal output stream
                    this.readOutputStream(terminalId, e.execution);
                }
            })
        );
    }

    private async readOutputStream(
        terminalId: string,
        execution: vscode.TerminalShellExecution
    ): Promise<void> {
        try {
            const stream = execution.read();
            for await (const data of stream) {
                this.notifyOutput(terminalId, data);
            }
        } catch (error) {
            // Stream ended or error - ignore
        }
    }

    private notifyOutput(terminalId: string, data: string): void {
        for (const callback of this.outputCallbacks) {
            callback(terminalId, data);
        }
    }

    onTerminalOutput(callback: TerminalOutputCallback): void {
        this.outputCallbacks.push(callback);
    }
}
```

## Test Scenarios

### TS-3.1: Output stream reading
- **Given**: Terminal running claude command
- **When**: Claude writes output
- **Then**: `onTerminalOutput` callback receives data

### TS-3.2: Multiple commands
- **Given**: Terminal running commands
- **When**: New command starts
- **Then**: New stream created, old stream ends

### TS-3.3: Stream cleanup
- **Given**: Command ends
- **When**: Stream exhausted
- **Then**: No memory leaks, no errors

## Notes

- Uses VSCode native API, no external dependencies
- Works with shell integration enabled terminals
- Escape sequences included in output (need to strip for pattern matching)
- Must call `read()` immediately on execution start to not miss data
