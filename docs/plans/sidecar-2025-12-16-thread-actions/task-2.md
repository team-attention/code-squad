# Task 2: ITerminalPort - Add closeTerminal and updateTerminalName

## Goal

Extend ITerminalPort interface with methods for closing terminals and updating terminal names.

## Location

`src/application/ports/outbound/ITerminalPort.ts`

## Changes

Add two new methods to the interface:

```typescript
/**
 * Close a terminal by ID.
 * Disposes the terminal instance but doesn't kill running processes.
 * No-op if terminal doesn't exist.
 */
closeTerminal(terminalId: string): void;

/**
 * Update terminal name/title.
 * Note: VSCode Terminal API has limitations on renaming.
 * Implementation may store name internally for display purposes.
 */
updateTerminalName(terminalId: string, newName: string): void;
```

## Test Scenarios

Interface-only change - tests will be added in Task 5 (VscodeTerminalGateway implementation).

## Dependencies

None
