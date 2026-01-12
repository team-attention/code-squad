# Task 5: Integrate Status Detection

## Goal

Wire status detection into terminal creation and update session metadata.

## Files

- `src/extension.ts`
- `src/adapters/outbound/gateways/VscodeTerminalGateway.ts`
- `src/application/ports/outbound/ITerminalPort.ts`

## Changes

### VscodeTerminalGateway Updates

Add method to create terminal with output interception:

```typescript
// ITerminalPort.ts - add to interface
createAITerminal(options: {
  command: string;
  args?: string[];
  cwd: string;
  name?: string;
}): {
  terminalId: string;
  onOutput: vscode.Event<string>;
  show(): void;
};
```

```typescript
// VscodeTerminalGateway.ts
import { AITerminalPty } from './AITerminalPty';

createAITerminal(options: CreateAITerminalOptions): AITerminalResult {
  const outputEmitter = new vscode.EventEmitter<string>();

  const pty = new AITerminalPty({
    command: options.command,
    args: options.args,
    cwd: options.cwd,
    onOutput: (data) => outputEmitter.fire(data),
    onClose: (code) => {
      // Handle terminal close
      outputEmitter.dispose();
    },
  });

  const terminal = vscode.window.createTerminal({
    name: options.name ?? `AI: ${options.command}`,
    pty,
  });

  const terminalId = this.getTerminalId(terminal);
  this.terminals.set(terminalId, terminal);

  return {
    terminalId,
    onOutput: outputEmitter.event,
    show: () => terminal.show(),
  };
}
```

### Extension.ts Wiring

```typescript
// Create use case
const terminalStatusDetector = new TerminalStatusDetector();
const detectStatusUseCase = new DetectThreadStatusUseCase(terminalStatusDetector);

// Subscribe to status changes
detectStatusUseCase.onStatusChange((terminalId, status) => {
  const sessionCtx = aiDetectionController.getSession(terminalId);
  if (sessionCtx) {
    const currentMetadata = sessionCtx.session.agentMetadata;
    sessionCtx.session.setAgentMetadata({
      name: currentMetadata?.name ?? sessionCtx.session.displayName,
      status,
      fileCount: currentMetadata?.fileCount ?? 0,
    });
    threadListController.refresh();
  }
});

// Update CreateThreadUseCase to use new terminal method
// When terminal created with AI command:
const result = terminalGateway.createAITerminal({
  command: 'claude',
  cwd: workspacePath,
  name: threadName,
});

result.onOutput((data) => {
  detectStatusUseCase.processOutput(result.terminalId, 'claude', data);
});
```

### Thread Creation Flow Update

In `CreateThreadUseCase` or its adapter:

1. When creating thread, use `createAITerminal` instead of regular terminal
2. Subscribe to `onOutput` event
3. Feed output to `DetectThreadStatusUseCase`

## Test Scenarios

### TS-5.1: Terminal creation with output subscription
- **Given**: User creates new thread
- **When**: Thread created with Claude command
- **Then**: Terminal output subscribed to status detection

### TS-5.2: Status propagates to session
- **Given**: Terminal outputting working patterns
- **When**: Status detected as `'working'`
- **Then**: Session `agentMetadata.status` updated

### TS-5.3: Thread list refreshed on status change
- **Given**: Status change detected
- **When**: `onStatusChange` callback fires
- **Then**: `threadListController.refresh()` called

### TS-5.4: Terminal close cleanup
- **Given**: Terminal with status tracking
- **When**: Terminal closed
- **Then**: `detectStatusUseCase.clear(terminalId)` called

## Notes

- Only new terminals get status detection
- Existing/attached terminals remain at `inactive` status
- Consider adding terminal close event handling for cleanup
