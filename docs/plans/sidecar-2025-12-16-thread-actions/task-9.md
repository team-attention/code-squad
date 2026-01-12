# Task 9: RenameThreadUseCase - Update Thread Name

## Goal

Create RenameThreadUseCase to update thread name across all components.

## Locations

- Interface: `src/application/ports/inbound/IRenameThreadUseCase.ts`
- Implementation: `src/application/useCases/RenameThreadUseCase.ts`
- Test: `src/test/application/useCases/RenameThreadUseCase.test.ts`

## Interface

```typescript
// src/application/ports/inbound/IRenameThreadUseCase.ts
export interface RenameThreadInput {
  threadId: string;
  newName: string;
}

export interface RenameThreadOutput {
  success: boolean;
  threadState: ThreadState | null;
  previousName: string | null;
}

export interface IRenameThreadUseCase {
  execute(input: RenameThreadInput): Promise<RenameThreadOutput>;
}
```

## Implementation

```typescript
// src/application/useCases/RenameThreadUseCase.ts
export class RenameThreadUseCase implements IRenameThreadUseCase {
  constructor(
    private readonly threadStateRepository: IThreadStateRepository,
    private readonly terminalPort: ITerminalPort,
    private readonly detectStatusUseCase: IDetectThreadStatusUseCase
  ) {}

  async execute(input: RenameThreadInput): Promise<RenameThreadOutput> {
    const { threadId, newName } = input;

    // 1. Find thread state
    const threadState = await this.threadStateRepository.findById(threadId);
    if (!threadState) {
      return {
        success: false,
        threadState: null,
        previousName: null
      };
    }

    const previousName = threadState.name;

    // 2. Create new thread state with updated name (immutable)
    const updatedState = threadState.withName(newName);

    // 3. Update terminal display name
    if (threadState.terminalId) {
      this.terminalPort.updateTerminalName(threadState.terminalId, newName);
    }

    // 4. Update status detection thread name
    this.detectStatusUseCase.setThreadName(threadState.terminalId, newName);

    // 5. Save updated thread state
    await this.threadStateRepository.save(updatedState);

    return {
      success: true,
      threadState: updatedState,
      previousName
    };
  }
}
```

## Test Scenarios

### RT1: Rename thread successfully
- **Given**: Thread exists with name="old-name"
- **When**: `execute({ threadId: "t1", newName: "new-name" })`
- **Then**: State updated, terminal name updated, status detection updated, success=true

### RT2: Rename non-existent thread
- **Given**: Thread with id="invalid" doesn't exist
- **When**: `execute({ threadId: "invalid", newName: "name" })`
- **Then**: Returns { success: false, threadState: null }

### RT3: Rename with empty name
- **Given**: Thread exists
- **When**: `execute({ threadId: "t1", newName: "" })`
- **Then**: Validation error from ThreadState.withName()

### RT4: Rename with too long name
- **Given**: Thread exists
- **When**: `execute({ threadId: "t1", newName: "a".repeat(51) })`
- **Then**: Validation error (max 50 chars)

### RT5: Previous name returned
- **Given**: Thread with name="original"
- **When**: `execute({ threadId: "t1", newName: "updated" })`
- **Then**: previousName="original" in output

### RT6: Terminal port called with correct args
- **Given**: Thread with terminalId="term-1"
- **When**: `execute({ threadId: "t1", newName: "new-name" })`
- **Then**: `terminalPort.updateTerminalName("term-1", "new-name")` called

## Dependencies

- Task 1 (ThreadState.withName)
- Task 5 (VscodeTerminalGateway.updateTerminalName)
