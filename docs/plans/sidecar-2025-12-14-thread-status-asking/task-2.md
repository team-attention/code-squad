# Task 2: Create TerminalStatusDetector

## Goal

Create domain service for detecting AI agent status from terminal output patterns.

## Files

- `src/domain/services/TerminalStatusDetector.ts` (new)

## Implementation

### Interface

```typescript
export type AIType = 'claude' | 'codex' | 'gemini' | 'unknown';

export interface ITerminalStatusDetector {
  detect(aiType: AIType, output: string): AgentStatus;
  detectFromBuffer(aiType: AIType, lines: string[]): AgentStatus;
}
```

### Pattern Definitions

```typescript
interface StatusPattern {
  status: AgentStatus;
  patterns: RegExp[];
  priority: number; // Higher = checked first
}
```

### Claude Code Patterns

**waiting** (priority: 3) - User input required:
- `/Enter to select/`
- `/\(y\/n\)/i`
- `/\[Y\/n\]/i`
- `/Tab\/Arrow keys/`
- `/Press Enter to continue/`
- `/\? .+$/` (question prompt at line end)

**working** (priority: 2) - Active processing:
- `/[●◐◓◑◒]/` (spinner chars)
- `/Reading/`
- `/Writing/`
- `/Searching/`
- `/Analyzing/`

**idle** (priority: 1) - Ready for next command:
- `/^> /m` (main prompt)
- `/-- INSERT --/`
- `/-- NORMAL --/`
- `/\d+ tokens/`

**inactive** (priority: 0) - No AI detected:
- Default when no AI command detected

### Detection Algorithm

1. Check patterns from highest to lowest priority
2. First match wins
3. Keep last 10 lines buffer for context
4. Return `idle` if no pattern matches (within active session)

### Debouncing

Status detector itself is stateless. Debouncing handled by caller (DetectThreadStatusUseCase).

## Test Scenarios

### TS-2.1: Detect Claude waiting state
- **Given**: Output contains `(y/n)`
- **When**: `detect('claude', output)` called
- **Then**: Returns `'waiting'`

### TS-2.2: Detect Claude working state
- **Given**: Output contains `● Reading src/index.ts`
- **When**: `detect('claude', output)` called
- **Then**: Returns `'working'`

### TS-2.3: Detect Claude idle state
- **Given**: Output ends with `> `
- **When**: `detect('claude', output)` called
- **Then**: Returns `'idle'`

### TS-2.4: Priority order
- **Given**: Output contains both `> ` and `(y/n)`
- **When**: `detect('claude', output)` called
- **Then**: Returns `'waiting'` (higher priority)

### TS-2.5: Unknown AI fallback
- **Given**: Unknown AI type
- **When**: `detect('unknown', output)` called
- **Then**: Uses generic patterns, returns best match

## Notes

- No VSCode imports (domain layer)
- Pure function, stateless
- Easily extensible for new AI tools
