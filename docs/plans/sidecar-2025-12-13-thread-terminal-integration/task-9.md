# Task 9: Update CommentRepository for Thread Filtering

## Scope

Update the comment repository to support thread-scoped queries.

## Deliverables

1. Update `src/application/ports/outbound/ICommentRepository.ts` - Add thread filtering
2. Update `src/infrastructure/repositories/JsonCommentRepository.ts` - Implement filtering

## Technical Design

```typescript
// src/application/ports/outbound/ICommentRepository.ts
export interface ICommentRepository {
  // existing methods...
  save(comment: Comment): Promise<void>;
  findByFile(filePath: string): Promise<Comment[]>;
  delete(id: string): Promise<boolean>;

  // new/modified methods
  findByFile(filePath: string, threadId?: string): Promise<Comment[]>;
  findByThread(threadId: string): Promise<Comment[]>;
  findAll(threadId?: string): Promise<Comment[]>;
}

// src/infrastructure/repositories/JsonCommentRepository.ts
export class JsonCommentRepository implements ICommentRepository {
  async findByFile(filePath: string, threadId?: string): Promise<Comment[]> {
    const all = await this.readAll();
    return all.filter(c =>
      c.filePath === filePath &&
      c.belongsToThread(threadId)
    );
  }

  async findByThread(threadId: string): Promise<Comment[]> {
    const all = await this.readAll();
    return all.filter(c => c.threadId === threadId);
  }

  async findAll(threadId?: string): Promise<Comment[]> {
    const all = await this.readAll();
    if (threadId === undefined) return all;
    return all.filter(c => c.belongsToThread(threadId));
  }
}
```

## Test Scenarios

### TS9.1: Find Comments by File and Thread

**Given**: Comments for file.ts: 2 for thread-1, 1 for thread-2
**When**: findByFile("file.ts", "thread-1") is called
**Then**: Returns 2 comments for thread-1

### TS9.2: Find All Comments for File (All Agents View)

**Given**: Comments for file.ts: 2 for thread-1, 1 for thread-2
**When**: findByFile("file.ts", undefined) is called
**Then**: Returns all 3 comments

### TS9.3: Find All Comments by Thread

**Given**: 3 comments for thread-1 across different files
**When**: findByThread("thread-1") is called
**Then**: Returns all 3 comments

### TS9.4: Find All with Thread Filter

**Given**: 5 comments total, 3 for thread-1
**When**: findAll("thread-1") is called
**Then**: Returns 3 comments

### TS9.5: Find All without Filter

**Given**: 5 comments total
**When**: findAll(undefined) is called
**Then**: Returns all 5 comments

### TS9.6: Legacy Comments Visibility

**Given**: 2 legacy comments without threadId
**When**: findByFile("file.ts", "thread-1") is called
**Then**: Legacy comments are NOT returned (they don't belong to thread-1)

**When**: findByFile("file.ts", undefined) is called
**Then**: Legacy comments ARE returned (All Agents view)

## Files to Modify

| File | Action |
|------|--------|
| `src/application/ports/outbound/ICommentRepository.ts` | MODIFY - add thread filtering |
| `src/infrastructure/repositories/JsonCommentRepository.ts` | MODIFY - implement filtering |

## Dependencies

- Task 8: Comment entity with threadId

## Notes

- undefined threadId means "All Agents" view (show all)
- Legacy comments (no threadId) visible only in All Agents view
- Filtering uses Comment.belongsToThread() for consistency
