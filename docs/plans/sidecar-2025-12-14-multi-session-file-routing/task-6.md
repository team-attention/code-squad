# Task 6: Modify SubmitCommentsUseCase for Routing

## Goal

Modify the comment submission use case to route comments to their owner threads instead of the focused thread.

## Layer

Application

## Files

- `src/application/useCases/SubmitCommentsUseCase.ts` - Modify existing use case

## Implementation Steps

1. Add new constructor dependencies:
   - `IFileThreadMappingRepository` (optional for backward compatibility)
   - `IThreadStateRepository` (to get thread names for notification)

2. Keep existing `execute()` method unchanged for backward compatibility

3. Add new `executeWithRouting()` method:
   ```typescript
   async executeWithRouting(
       focusedSession: AISession | undefined
   ): Promise<SubmitCommentsResult | null>
   ```

4. Implementation of `executeWithRouting()`:
   - Get all active comments from repository
   - If no comments, return null
   - Group comments by `filePath`
   - For each file, lookup owner thread from `mappingRepository.findByFilePath()`
   - If no mapping, use focused session's threadId as fallback
   - If no focused session and no mapping, show warning and return null
   - Group comments by owner threadId
   - For each thread group, format prompt and send to terminal
   - Mark all comments as submitted
   - Build notification message listing threads that received comments

5. Add helper methods:
   - `groupByFile(comments: Comment[]): Map<string, Comment[]>`
   - `groupByOwnerThread(byFile, focusedSession): Promise<Map<string, Comment[]>>`
   - `buildNotificationMessage(byThread): string`

6. Update the adapter that calls this use case to use `executeWithRouting()`

## Test Scenarios

### TDD Order

1. Write test for TS3 (Multi-Thread Routing) → implement → pass
2. Write test for TS4 (Fallback to Focused) → implement → pass
3. Write test for TS5 (No Target) → implement → pass

### TS3: RouteComments - Multi-Thread Routing

```pseudo
// Arrange
mockCommentRepo = {
  findActive: vi.fn(() => [
    { id: "c1", filePath: "src/app.ts", text: "Fix this", startLine: 10 },
    { id: "c2", filePath: "src/util.ts", text: "Refactor", startLine: 20 }
  ]),
  markAsSubmitted: vi.fn()
}
mockMappingRepo = {
  findByFilePath: vi.fn((path) => {
    if (path === "src/app.ts") return { threadId: "tid-a", filePath: path }
    if (path === "src/util.ts") return { threadId: "tid-b", filePath: path }
    return null
  })
}
mockTerminalPort = { sendText: vi.fn() }
mockNotificationPort = { showInfo: vi.fn() }
mockThreadRepo = {
  findById: vi.fn((id) => {
    if (id === "tid-a") return { threadId: "tid-a", name: "Thread A" }
    if (id === "tid-b") return { threadId: "tid-b", name: "Thread B" }
    return null
  })
}

useCase = new SubmitCommentsUseCase(
  mockCommentRepo, mockTerminalPort, mockNotificationPort,
  mockMappingRepo, mockThreadRepo
)

// Act
await useCase.executeWithRouting(focusedSession)

// Assert
expect(mockTerminalPort.sendText).toHaveBeenCalledTimes(2)
expect(mockTerminalPort.sendText).toHaveBeenCalledWith("tid-a", expect.stringContaining("Fix this"))
expect(mockTerminalPort.sendText).toHaveBeenCalledWith("tid-b", expect.stringContaining("Refactor"))
expect(mockNotificationPort.showInfo).toHaveBeenCalledWith(
  expect.stringMatching(/Thread A.*Thread B|Thread B.*Thread A/)
)
```

### TS4: RouteComments - Fallback to Focused Thread

```pseudo
// Arrange
mockCommentRepo = {
  findActive: vi.fn(() => [
    { id: "c1", filePath: "src/new.ts", text: "New file", startLine: 1 }
  ]),
  markAsSubmitted: vi.fn()
}
mockMappingRepo = {
  findByFilePath: vi.fn(() => null)  // No mapping exists
}
mockTerminalPort = { sendText: vi.fn() }
focusedSession = { threadState: { threadId: "tid-focused", name: "Focused" } }

useCase = new SubmitCommentsUseCase(...)

// Act
await useCase.executeWithRouting(focusedSession)

// Assert
expect(mockTerminalPort.sendText).toHaveBeenCalledWith(
  "tid-focused",  // Fallback to focused
  expect.stringContaining("New file")
)
```

### TS5: RouteComments - No Mapping, No Focused Thread

```pseudo
// Arrange
mockCommentRepo = {
  findActive: vi.fn(() => [{ id: "c1", filePath: "src/new.ts", text: "Review" }])
}
mockMappingRepo = { findByFilePath: vi.fn(() => null) }
mockNotificationPort = { showWarning: vi.fn() }
focusedSession = null  // No session

// Act
result = await useCase.executeWithRouting(focusedSession)

// Assert
expect(result).toBeNull()
expect(mockNotificationPort.showWarning).toHaveBeenCalledWith(
  expect.stringContaining("No active thread")
)
```

## Reference Code

Current `SubmitCommentsUseCase.execute()` structure:

```typescript
async execute(session: AISession | undefined): Promise<SubmitCommentsResult | null> {
    if (!session) {
        return null;
    }

    const comments = await this.commentRepository.findActive();
    if (comments.length === 0) {
        return null;
    }

    const prompt = this.formatCommentsAsPrompt(comments);
    this.terminalPort.sendText(session.terminalId, prompt);

    // ... mark as submitted
}
```

## Validation

- [ ] New dependencies added to constructor
- [ ] `executeWithRouting()` method implemented
- [ ] Test scenarios TS3, TS4, TS5 pass
- [ ] Existing `execute()` method unchanged
- [ ] No vscode imports
- [ ] Type check passes
