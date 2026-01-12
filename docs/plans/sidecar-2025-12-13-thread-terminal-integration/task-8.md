# Task 8: Add threadId to Comment Entity

## Scope

Extend the Comment entity to support thread association.

## Deliverables

1. Update `src/domain/entities/Comment.ts` - Add optional threadId field

## Technical Design

```typescript
// src/domain/entities/Comment.ts - modifications
export interface CommentData {
  // existing fields...
  id: string;
  filePath: string;
  startLine: number;
  endLine: number;
  text: string;
  createdAt: number;
  // new field
  threadId?: string;
}

export class Comment {
  readonly id: string;
  readonly filePath: string;
  readonly startLine: number;
  readonly endLine: number;
  readonly text: string;
  readonly createdAt: number;
  readonly threadId?: string;  // NEW

  // Update constructor and factory methods to handle threadId
  static create(data: Omit<CommentData, 'id' | 'createdAt'>): Comment;
  static fromData(data: CommentData): Comment;

  toData(): CommentData;

  // Helper for filtering
  belongsToThread(threadId: string | undefined): boolean {
    if (threadId === undefined) return true;  // "All Agents" view
    return this.threadId === threadId;
  }
}
```

## Test Scenarios

### TS8.1: Create Comment with ThreadId

**Given**: Valid comment parameters including threadId
**When**: Comment.create({ ..., threadId: "thread-1" }) is called
**Then**: Comment has threadId "thread-1"

### TS8.2: Create Comment without ThreadId (Backward Compatibility)

**Given**: Valid comment parameters without threadId
**When**: Comment.create({ ... }) is called
**Then**: Comment has threadId undefined (global comment)

### TS8.3: Serialize/Deserialize with ThreadId

**Given**: Comment with threadId "thread-1"
**When**: toData() then fromData() round-trip
**Then**: ThreadId is preserved

### TS8.4: belongsToThread Filter - Specific Thread

**Given**: Comment with threadId "thread-1"
**When**: belongsToThread("thread-1") is called
**Then**: Returns true

**Given**: Comment with threadId "thread-1"
**When**: belongsToThread("thread-2") is called
**Then**: Returns false

### TS8.5: belongsToThread Filter - All Agents View

**Given**: Comment with threadId "thread-1"
**When**: belongsToThread(undefined) is called
**Then**: Returns true (all comments visible in aggregate view)

### TS8.6: Legacy Comment Compatibility

**Given**: Existing comment data without threadId field
**When**: Comment.fromData(legacyData) is called
**Then**: Comment created with threadId undefined

## Files to Modify

| File | Action |
|------|--------|
| `src/domain/entities/Comment.ts` | MODIFY - add threadId |

## Dependencies

- Task 1: ThreadState entity (for threadId type consistency)

## Notes

- threadId is optional for backward compatibility
- Existing comments without threadId are treated as global
- "All Agents" view shows all comments regardless of threadId
- belongsToThread helper simplifies filtering logic
