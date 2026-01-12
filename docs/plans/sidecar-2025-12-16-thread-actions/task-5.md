# Task 5: VscodeTerminalGateway - Implement New Port Methods

## Goal

Implement `closeTerminal()` and `updateTerminalName()` in VscodeTerminalGateway.

## Location

`src/adapters/outbound/gateways/VscodeTerminalGateway.ts`

## Changes

### closeTerminal

```typescript
closeTerminal(terminalId: string): void {
  const terminal = this.getTerminalById(terminalId);
  if (terminal) {
    terminal.dispose();
    this.unregisterTerminal(terminalId);
  }
}
```

### updateTerminalName

VSCode Terminal API limitation: Cannot rename terminals after creation. Options:

1. **Option A (Recommended)**: Store name internally, update only display references
   - Keep internal map of terminalId → displayName
   - Return displayName in getTerminalInfo methods
   - Don't change actual terminal title

2. **Option B**: Recreate terminal with new name
   - Disruptive to running processes
   - Not recommended

Implementation (Option A):

```typescript
private terminalDisplayNames: Map<string, string> = new Map();

updateTerminalName(terminalId: string, newName: string): void {
  this.terminalDisplayNames.set(terminalId, newName);
  // Note: Actual terminal title unchanged due to VSCode API limitation
}

getDisplayName(terminalId: string): string | undefined {
  return this.terminalDisplayNames.get(terminalId);
}
```

## Test Scenarios

### TG1: Close existing terminal
- **Given**: Terminal with id="term-1" exists
- **When**: `closeTerminal("term-1")`
- **Then**: Terminal disposed, unregistered from internal map

### TG2: Close non-existent terminal
- **Given**: No terminal with id="term-x"
- **When**: `closeTerminal("term-x")`
- **Then**: No error thrown (no-op)

### TG3: Update terminal name
- **Given**: Terminal with id="term-1" exists
- **When**: `updateTerminalName("term-1", "New Name")`
- **Then**: Internal display name map updated

### TG4: Get display name after update
- **Given**: `updateTerminalName("term-1", "New Name")` called
- **When**: `getDisplayName("term-1")`
- **Then**: Returns "New Name"

## Dependencies

- Task 2 (ITerminalPort interface)
