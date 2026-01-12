# Task 4: Extend ITerminalPort with createTerminal

## Scope

Add terminal creation capability to the terminal port interface and gateway.

## Deliverables

1. Update `src/application/ports/outbound/ITerminalPort.ts` - Add createTerminal method
2. Update `src/adapters/outbound/gateways/VscodeTerminalGateway.ts` - Implement createTerminal

## Technical Design

```typescript
// src/application/ports/outbound/ITerminalPort.ts
export interface ITerminalPort {
  // existing
  sendText(terminalId: string, text: string): void;
  showTerminal(terminalId: string): void;

  // new
  createTerminal(name: string, cwd?: string): Promise<string>; // returns terminalId
}

// src/adapters/outbound/gateways/VscodeTerminalGateway.ts
export class VscodeTerminalGateway implements ITerminalPort {
  // existing methods...

  async createTerminal(name: string, cwd?: string): Promise<string> {
    const terminal = vscode.window.createTerminal({
      name,
      cwd,
    });
    terminal.show();

    // Extract terminal ID from processId or use name as fallback
    const processId = await terminal.processId;
    const terminalId = processId?.toString() ?? name;

    return terminalId;
  }
}
```

## Test Scenarios

### TS4.1: Create Terminal with Name Only

**Given**: VSCode workspace is open
**When**: createTerminal("my-agent") is called
**Then**:
- Terminal is created with name "my-agent"
- Terminal is shown
- Returns terminal ID

### TS4.2: Create Terminal with CWD

**Given**: VSCode workspace is open
**When**: createTerminal("my-agent", "/path/to/worktree") is called
**Then**:
- Terminal is created with name "my-agent"
- Terminal cwd is set to "/path/to/worktree"
- Returns terminal ID

### TS4.3: Terminal ID Uniqueness

**Given**: Two terminals created with same name
**When**: Both terminals are active
**Then**: Each has unique terminal ID

## Files to Modify

| File | Action |
|------|--------|
| `src/application/ports/outbound/ITerminalPort.ts` | MODIFY - add createTerminal |
| `src/adapters/outbound/gateways/VscodeTerminalGateway.ts` | MODIFY - implement createTerminal |

## Dependencies

None - independent of other tasks.

## Notes

- Terminal ID extraction from processId for consistency with existing detection
- Terminal is auto-shown after creation
- cwd parameter enables worktree support
