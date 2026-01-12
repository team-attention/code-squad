# Spec: Terminal Status Detection

## Overview

Detect AI agent status from terminal output patterns across Claude Code, Codex CLI, and Gemini CLI.

## Problem

Current implementation uses `onDidStartTerminalShellExecution` / `onDidEndTerminalShellExecution` which only detects command start/end, not the nuanced states within AI interactions.

## Constraint

**VSCode stable API does not expose terminal output content.**

- `onDidWriteTerminalData` is a proposed API (Insiders only) - **NOT acceptable**
- No other stable API provides access to terminal output
- Shell execution events only fire at command start/end, not during interactive sessions

## Status Definitions

| Status | Description | Visual |
|--------|-------------|--------|
| **working** | AI actively processing (reading files, executing, thinking) | Green |
| **waiting** | AI waiting for user input (selection menu, confirmation, question) | Yellow |
| **idle** | AI finished, ready for next command (prompt state) | Gray |
| **error** | Error occurred | Red |

## Detection Patterns by AI Tool

### Claude Code

**working** patterns:
- `● ` (filled circle) - reading/writing files
- `◐ ◓ ◑ ◒` - spinner animation
- `Reading`, `Writing`, `Searching`
- Tool execution output

**waiting** patterns:
- `Enter to select` - selection menu active
- `(y/n)` or `[Y/n]` - yes/no prompt
- `? ` at line start - question prompt
- `Tab/Arrow keys to navigate`
- `Press Enter to continue`

**idle** patterns:
- `> ` at line start with cursor - main prompt
- `-- INSERT --` or `-- NORMAL --` - vim-style input mode
- `0 tokens` or `\d+ tokens` at end - token counter visible

### Codex CLI

**working** patterns:
- `⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏` - braille spinner
- `Running...`, `Executing...`
- File operation output

**waiting** patterns:
- `? ` - inquirer-style prompt
- `Select`, `Choose`
- `(Y/n)`, `(y/N)`

**idle** patterns:
- `codex>` or similar prompt
- Empty prompt line

### Gemini CLI

**working** patterns:
- Spinner characters
- `Thinking...`, `Processing...`
- File read/write indicators

**waiting** patterns:
- Interactive prompts
- Confirmation requests

**idle** patterns:
- `>` prompt
- Ready state indicator

## Architecture

### New Components

```
src/
├── domain/
│   ├── entities/
│   │   └── AISession.ts                 # AgentStatus type (existing)
│   └── services/
│       └── TerminalStatusDetector.ts    # Pattern matching logic (NEW)
│
├── application/
│   └── ports/
│       └── outbound/
│           └── ITerminalPort.ts         # Terminal port (existing)
│
└── adapters/
    └── outbound/
        └── gateways/
            ├── VscodeTerminalGateway.ts # Terminal management (existing)
            └── AITerminalPty.ts         # Pseudoterminal wrapper (NEW)
```

### TerminalStatusDetector

```typescript
interface StatusPattern {
  status: AgentStatus;
  patterns: RegExp[];
  priority: number;  // Higher = checked first
}

class TerminalStatusDetector {
  private patterns: Map<AIType, StatusPattern[]>;

  detect(aiType: AIType, terminalOutput: string): AgentStatus;
  detectFromBuffer(aiType: AIType, recentLines: string[]): AgentStatus;
}
```

### Detection Strategy

1. **Buffer-based detection**: Keep last N lines (e.g., 10) of terminal output
2. **Pattern matching**: Check patterns from highest to lowest priority
3. **Debouncing**: Avoid rapid status changes (min 200ms between changes)
4. **Fallback**: Default to 'idle' if no pattern matches after timeout

### Priority Order

1. **waiting** (highest) - User input required, most important to show
2. **working** - Active processing
3. **idle** (lowest) - Default state

## Solution: Pseudoterminal Wrapper

Since stable VSCode API cannot read terminal output, we create our own terminal using `Pseudoterminal` which provides the `onDidWrite` event.

### How It Works

```
┌──────────────────────────────────────────────────────────┐
│                    VSCode Terminal                        │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Pseudoterminal (our wrapper)           │ │
│  │  ┌─────────────────────────────────────────────────┐│ │
│  │  │         AI CLI Process (claude, codex, etc)     ││ │
│  │  └─────────────────────────────────────────────────┘│ │
│  │                                                     │ │
│  │  onDidWrite ◄─── intercept output ─── pattern match │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### Pseudoterminal API (Stable)

```typescript
interface Pseudoterminal {
  onDidWrite: Event<string>;      // ✅ Fires when output written
  onDidClose?: Event<number>;     // ✅ Fires when closed
  open(initialDimensions): void;
  close(): void;
  handleInput?(data: string): void;
}
```

### Implementation

```typescript
class AITerminalWrapper implements vscode.Pseudoterminal {
  private writeEmitter = new vscode.EventEmitter<string>();
  private process: ChildProcess;
  private statusDetector: TerminalStatusDetector;

  onDidWrite = this.writeEmitter.event;

  constructor(
    private command: string,  // 'claude', 'codex', 'gemini'
    private onStatusChange: (status: AgentStatus) => void
  ) {}

  open(dimensions: vscode.TerminalDimensions): void {
    // Spawn AI CLI process
    this.process = spawn(this.command, [], {
      env: { ...process.env, TERM: 'xterm-256color' },
      cols: dimensions.columns,
      rows: dimensions.rows,
    });

    // Intercept output
    this.process.stdout.on('data', (data: Buffer) => {
      const text = data.toString();

      // Forward to terminal display
      this.writeEmitter.fire(text);

      // Detect status from output
      const status = this.statusDetector.detect(text);
      this.onStatusChange(status);
    });
  }

  handleInput(data: string): void {
    // Forward user input to AI process
    this.process.stdin.write(data);
  }

  close(): void {
    this.process.kill();
  }
}
```

### Creating Terminal with Wrapper

```typescript
function createAITerminal(aiType: AIType): string {
  const wrapper = new AITerminalWrapper(
    aiType,  // 'claude' | 'codex' | 'gemini'
    (status) => updateSessionStatus(terminalId, status)
  );

  const terminal = vscode.window.createTerminal({
    name: `AI: ${aiType}`,
    pty: wrapper,  // Use our Pseudoterminal
  });

  return terminalId;
}
```

### Limitation

This approach only works for terminals **we create**. Cannot attach to existing terminals.

**Impact**:
- "New Thread" button → Works (we create the terminal)
- "Attach to Terminal" command → Cannot detect status (existing terminal)

## State Machine

```
                    ┌─────────────────────────┐
                    │                         │
                    ▼                         │
    ┌──────┐   cmd start   ┌─────────┐   user input   ┌─────────┐
    │ idle │ ────────────► │ working │ ─────────────► │ waiting │
    └──────┘               └─────────┘                └─────────┘
        ▲                       │                          │
        │                       │ cmd end                  │
        │                       │ (no prompt)              │ user responds
        │                       ▼                          │
        │                  ┌─────────┐                     │
        └──────────────────│  idle   │◄────────────────────┘
                           └─────────┘
```

## Use Cases

### UC-1: Detect Working State

**Actor**: System
**Trigger**: Terminal outputs working indicator
**Flow**:
1. Terminal outputs spinner or processing message
2. TerminalStatusDetector matches 'working' pattern
3. Update session status to 'working'
4. Refresh thread list UI

### UC-2: Detect Waiting State

**Actor**: System
**Trigger**: Terminal shows user prompt
**Flow**:
1. Terminal outputs selection menu or confirmation prompt
2. TerminalStatusDetector matches 'waiting' pattern
3. Update session status to 'waiting'
4. Refresh thread list UI (yellow indicator)

### UC-3: Detect Idle State

**Actor**: System
**Trigger**: AI finishes and shows prompt
**Flow**:
1. Terminal shows main prompt (e.g., `> `)
2. TerminalStatusDetector matches 'idle' pattern
3. Update session status to 'idle'
4. Refresh thread list UI

## Test Scenarios

### TS-1: Claude Code Selection Menu

**Given**: Claude Code shows selection menu with "Enter to select"
**When**: Pattern detection runs
**Then**: Status is 'waiting'

### TS-2: Claude Code Main Prompt

**Given**: Claude Code shows `> ` prompt with `-- INSERT --`
**When**: Pattern detection runs
**Then**: Status is 'idle'

### TS-3: Claude Code Reading File

**Given**: Claude Code shows `● Reading src/index.ts`
**When**: Pattern detection runs
**Then**: Status is 'working'

### TS-4: Status Debouncing

**Given**: Rapid terminal output changes
**When**: Multiple pattern matches within 200ms
**Then**: Only last status is applied

### TS-5: Fallback to Idle

**Given**: Unknown terminal output
**When**: No pattern matches for 2 seconds after command end
**Then**: Status defaults to 'idle'

## Implementation Notes

1. **Extensible patterns**: Store patterns in config for easy updates
2. **AI type detection**: Reuse existing AIDetectionController logic
3. **Performance**: Limit buffer size, use efficient regex
4. **Testing**: Create mock terminal output for each AI tool

## Open Questions

1. How to handle "Attach to Terminal" for existing terminals?
   - Option A: Show "unknown" status (gray, no pattern detection)
   - Option B: Deprecate/remove attach feature, only support "New Thread"
   - Option C: Show basic "active" status using shell execution events

2. How to handle custom/unknown AI tools?
   - Option A: Generic patterns only
   - Option B: User-configurable patterns

3. Should we use `node-pty` for better PTY handling?
   - Pro: More reliable PTY emulation, proper signal handling
   - Con: Native dependency, platform-specific builds

## References

- [VSCode Terminal API](https://code.visualstudio.com/api/references/vscode-api#Terminal)
- [VSCode Pseudoterminal](https://code.visualstudio.com/api/references/vscode-api#Pseudoterminal)
- [node-pty](https://github.com/microsoft/node-pty) - Native PTY library (optional)
- Current implementation: `src/adapters/outbound/gateways/VscodeTerminalGateway.ts`
