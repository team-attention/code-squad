# Implementation Plan: Multi-Session File Routing

## Overview

Enable intelligent comment and action routing based on file-thread mapping in multi-thread environments. When a file is modified by a thread, track that ownership. When users submit comments, route them to the appropriate thread's terminal based on which thread last modified each file.

## Technical Design

### Current State Analysis

| Component | Location | Status |
|-----------|----------|--------|
| `Comment.threadId` | `domain/entities/Comment.ts:22` | Exists - associates comments with threads |
| `FileWatchController` | `adapters/inbound/controllers/FileWatchController.ts` | Handles file change detection |
| `FileWatchController.processFileChange` | Line ~731-803 | Processes file changes but does NOT track which thread modified |
| `SubmitCommentsUseCase` | `application/useCases/SubmitCommentsUseCase.ts` | Sends ALL comments to a single terminal |
| `IThreadStateRepository` | `application/ports/outbound/IThreadStateRepository.ts` | Persists thread state |
| `SessionContext.threadState` | `application/ports/outbound/SessionContext.ts:64` | Links session to thread |

**What's missing**:

1. **FileThreadMapping Entity** - No domain model to track "this file was last modified by this thread"
2. **IFileThreadMappingRepository** - No repository to store/lookup file-thread mappings
3. **TrackFileOwnershipUseCase** - No use case to record file ownership on modification
4. **SubmitCommentsUseCase modification** - Currently routes ALL comments to one terminal; needs to group by file owner
5. **DiffHeader UI modification** - No visual indication of which thread owns a file

### Data Flow

#### UC-1: Track File Modification by Thread

```
FileWatchController.processFileChange(data)
    │
    ├── (existing) notifyFileChange(session, ...)
    │
    └── (NEW) trackFileOwnershipUseCase.execute({
            filePath: data.relativePath,
            threadId: session.threadState?.threadId
        })
        │
        └── fileThreadMappingRepository.save(mapping)
```

**Key insight**: The `processFileChange` method (line 731-803) already iterates through sessions. We can determine which thread triggered the change by checking which session's workspaceRoot matches.

#### UC-2: Route Comments to Owner Thread

```
SubmitCommentsUseCase.execute(session)   // Currently: single session
    │
    └── (MODIFIED) SubmitCommentsUseCase.executeWithRouting()
            │
            ├── commentRepository.findActive()
            │
            ├── Group comments by file
            │       └── For each file, lookup owner thread
            │           └── fileThreadMappingRepository.findByFilePath(file)
            │
            ├── Group files by owner thread
            │       └── { threadId: [comments...] }
            │
            └── For each thread group:
                    └── terminalPort.sendText(threadId, groupedPrompt)
```

#### UC-3: Display File Ownership in UI

```
PanelState.sessionFiles: FileInfo[]
    │
    └── (EXTEND) FileInfo.ownerThreadId?: string
                 FileInfo.ownerThreadName?: string

DiffHeader.render(props)
    │
    └── (NEW) if (props.ownerThreadName && multipleThreadsExist) {
                  renderThreadBadge(ownerThreadName)
              }
```

### API Changes

#### New Domain Entity: FileThreadMapping

```typescript
// domain/entities/FileThreadMapping.ts
export interface FileThreadMappingData {
    filePath: string;           // Relative path from workspace root
    threadId: string;           // Thread that last modified this file
    lastModifiedAt: number;     // Timestamp of last modification
}

export class FileThreadMapping {
    readonly filePath: string;
    readonly threadId: string;
    readonly lastModifiedAt: number;

    static create(data: Omit<FileThreadMappingData, 'lastModifiedAt'>): FileThreadMapping;
    static fromData(data: FileThreadMappingData): FileThreadMapping;
    toData(): FileThreadMappingData;
}
```

#### New Outbound Port: IFileThreadMappingRepository

```typescript
// application/ports/outbound/IFileThreadMappingRepository.ts
export interface IFileThreadMappingRepository {
    save(mapping: FileThreadMapping): Promise<void>;
    findByFilePath(filePath: string): Promise<FileThreadMapping | null>;
    findByThreadId(threadId: string): Promise<FileThreadMapping[]>;
    findAll(): Promise<FileThreadMapping[]>;
    delete(filePath: string): Promise<boolean>;
    clear(): Promise<void>;
}
```

#### New Use Case: TrackFileOwnershipUseCase

```typescript
// application/useCases/TrackFileOwnershipUseCase.ts
export interface TrackFileOwnershipInput {
    filePath: string;
    threadId: string;
}

export class TrackFileOwnershipUseCase implements ITrackFileOwnershipUseCase {
    constructor(
        private readonly mappingRepository: IFileThreadMappingRepository
    ) {}

    async execute(input: TrackFileOwnershipInput): Promise<void>;
}
```

#### Modified Use Case: SubmitCommentsUseCase

```typescript
// application/useCases/SubmitCommentsUseCase.ts (modified)
export class SubmitCommentsUseCase implements ISubmitCommentsUseCase {
    constructor(
        private readonly commentRepository: ICommentRepository,
        private readonly terminalPort: ITerminalPort,
        private readonly notificationPort: INotificationPort,
        private readonly mappingRepository?: IFileThreadMappingRepository,  // NEW
        private readonly threadStateRepository?: IThreadStateRepository     // NEW
    ) {}

    // EXISTING: single session submission (unchanged for backward compatibility)
    async execute(session: AISession | undefined): Promise<SubmitCommentsResult | null>;

    // NEW: multi-thread routing
    async executeWithRouting(
        focusedSession: AISession | undefined
    ): Promise<SubmitCommentsResult | null>;
}
```

#### Modified Interface: FileInfo

```typescript
// application/ports/outbound/PanelState.ts (modified)
export interface FileInfo {
    path: string;
    name: string;
    status: 'modified' | 'added' | 'deleted';
    agentName?: string;
    agentColorIndex?: number;
    ownerThreadId?: string;      // NEW: Thread that last modified this file
    ownerThreadName?: string;    // NEW: Display name for UI badge
}
```

## Test Scenarios

### TS1: TrackFileOwnership - Happy Path
**Use Case**: UC-1

```pseudo
// Arrange
mockRepository = {
  save: fn(mapping) => void,
  findByFilePath: fn() => null
}
useCase = new TrackFileOwnershipUseCase(mockRepository)
input = { filePath: "src/app.ts", threadId: "tid-a" }

// Act
await useCase.execute(input)

// Assert
expect(mockRepository.save).toHaveBeenCalledWith(
  expect.objectContaining({
    filePath: "src/app.ts",
    threadId: "tid-a",
    lastModifiedAt: expect.any(Number)
  })
)
```

### TS2: TrackFileOwnership - Overwrite Existing Mapping
**Use Case**: UC-1

```pseudo
// Arrange
mockRepository = {
  save: fn(mapping) => void,
  findByFilePath: fn() => { filePath: "src/app.ts", threadId: "old-tid", lastModifiedAt: 100 }
}
useCase = new TrackFileOwnershipUseCase(mockRepository)
input = { filePath: "src/app.ts", threadId: "new-tid" }

// Act
await useCase.execute(input)

// Assert
expect(mockRepository.save).toHaveBeenCalledWith(
  expect.objectContaining({
    filePath: "src/app.ts",
    threadId: "new-tid"  // New thread overwrites
  })
)
```

### TS3: RouteComments - Multi-Thread Routing
**Use Case**: UC-2

```pseudo
// Arrange
mockCommentRepo = {
  findActive: fn() => [
    { id: "c1", filePath: "src/app.ts", text: "Fix this" },
    { id: "c2", filePath: "src/util.ts", text: "Refactor" }
  ],
  markAsSubmitted: fn() => void
}
mockMappingRepo = {
  findByFilePath: fn(path) => {
    if (path === "src/app.ts") return { threadId: "tid-a" }
    if (path === "src/util.ts") return { threadId: "tid-b" }
    return null
  }
}
mockTerminalPort = { sendText: fn() => void }
mockNotificationPort = { showInfo: fn() => void }
mockThreadRepo = {
  findById: fn(id) => {
    if (id === "tid-a") return { name: "Thread A" }
    if (id === "tid-b") return { name: "Thread B" }
    return null
  }
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
  expect.stringContaining("Thread A")
)
```

### TS4: RouteComments - Fallback to Focused Thread
**Use Case**: UC-2

```pseudo
// Arrange
mockCommentRepo = {
  findActive: fn() => [
    { id: "c1", filePath: "src/new.ts", text: "New file" }
  ],
  markAsSubmitted: fn() => void
}
mockMappingRepo = {
  findByFilePath: fn() => null  // No mapping exists
}
mockTerminalPort = { sendText: fn() => void }
focusedSession = { threadState: { threadId: "tid-focused" } }

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
**Use Case**: UC-2

```pseudo
// Arrange
mockCommentRepo = {
  findActive: fn() => [{ id: "c1", filePath: "src/new.ts", text: "Review" }]
}
mockMappingRepo = { findByFilePath: fn() => null }
focusedSession = null  // No session

// Act
result = await useCase.executeWithRouting(focusedSession)

// Assert
expect(result).toBeNull()  // Cannot route without target
expect(mockNotificationPort.showWarning).toHaveBeenCalledWith(
  "No active thread to receive comments"
)
```

### TS6: DisplayOwnership - Show Thread Badge
**Use Case**: UC-3

```pseudo
// Arrange
fileInfo = {
  path: "src/app.ts",
  ownerThreadId: "tid-a",
  ownerThreadName: "Feature A"
}
multipleThreadsExist = true

// Act
render(DiffHeader, { file: fileInfo, multipleThreadsExist })

// Assert
expect(screen).toContain("[Feature A]")  // Badge displayed
```

### TS7: DisplayOwnership - Hide Badge for Single Thread
**Use Case**: UC-3

```pseudo
// Arrange
fileInfo = {
  path: "src/app.ts",
  ownerThreadId: "tid-a",
  ownerThreadName: "Feature A"
}
multipleThreadsExist = false  // Only one thread

// Act
render(DiffHeader, { file: fileInfo, multipleThreadsExist })

// Assert
expect(screen).not.toContain("[Feature A]")  // No badge
```

### TS8: InMemoryRepository - Save and Find
**Use Case**: UC-1, UC-2

```pseudo
// Arrange
repository = new InMemoryFileThreadMappingRepository()
mapping = FileThreadMapping.create({ filePath: "src/app.ts", threadId: "tid-a" })

// Act
await repository.save(mapping)
result = await repository.findByFilePath("src/app.ts")

// Assert
expect(result).not.toBeNull()
expect(result.threadId).toBe("tid-a")
```

### TS9: InMemoryRepository - Clear All
**Use Case**: UC-1

```pseudo
// Arrange
repository = new InMemoryFileThreadMappingRepository()
await repository.save(mapping1)
await repository.save(mapping2)

// Act
await repository.clear()
result = await repository.findAll()

// Assert
expect(result).toHaveLength(0)
```

## Task List

| Task | Description | Layer | Dependencies | Test Scenarios |
|------|-------------|-------|--------------|----------------|
| task-1 | Create FileThreadMapping entity | Domain | - | - |
| task-2 | Create IFileThreadMappingRepository port | Application | task-1 | - |
| task-3 | Implement InMemoryFileThreadMappingRepository | Infrastructure | task-1, task-2 | TS8, TS9 |
| task-4 | Create TrackFileOwnershipUseCase | Application | task-1, task-2 | TS1, TS2 |
| task-5 | Integrate tracking into FileWatchController | Adapter | task-4 | - |
| task-6 | Modify SubmitCommentsUseCase for routing | Application | task-2 | TS3, TS4, TS5 |
| task-7 | Extend FileInfo and propagate owner info | Application/Adapter | task-2 | - |
| task-8 | Update DiffHeader UI for thread badge | Adapter | task-7 | TS6, TS7 |
| task-9 | Wire dependencies in extension.ts | Entry Point | task-3, task-4, task-6 | - |

## Testing Strategy

- **Unit tests**: All use cases (TS1-TS5), repository (TS8-TS9)
- **Component tests**: UI rendering (TS6, TS7) via snapshot or DOM assertions
- **Integration**: Manual testing with multiple threads

## Critical Files

| File | Purpose |
|------|---------|
| `src/adapters/inbound/controllers/FileWatchController.ts` | Hook point for tracking (lines 731-803) |
| `src/application/useCases/SubmitCommentsUseCase.ts` | Modify for routing |
| `src/application/ports/outbound/PanelState.ts` | Extend FileInfo (lines 29-37) |
| `src/infrastructure/repositories/InMemorySnapshotRepository.ts` | Pattern to follow |
| `src/extension.ts` | DI wiring (lines 37-179) |

## Success Criteria

1. File modifications are tracked with thread ownership
2. Comments are routed to the terminal of the thread that modified the file
3. Files without mapping fallback to the focused thread
4. UI displays thread badge when multiple threads exist
5. In-memory storage (no persistence required per spec)
6. All test scenarios pass
