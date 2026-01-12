# Task 7: JsonCommentRepository - Implement deleteByThreadId

## Goal

Implement `deleteByThreadId()` method to delete all comments associated with a thread.

## Location

`src/infrastructure/repositories/JsonCommentRepository.ts`

## Changes

```typescript
async deleteByThreadId(threadId: string): Promise<number> {
  const allComments = await this.findAll();
  const toKeep = allComments.filter(c => c.threadId !== threadId);
  const deletedCount = allComments.length - toKeep.length;

  if (deletedCount > 0) {
    await this.saveAll(toKeep);
  }

  return deletedCount;
}
```

## Test Scenarios

### CR1: Delete comments for thread with comments
- **Given**: Comments exist with threadId="thread-1" (3 comments)
- **When**: `deleteByThreadId("thread-1")`
- **Then**: Returns 3, those comments removed from storage

### CR2: Delete comments for thread without comments
- **Given**: No comments exist with threadId="thread-x"
- **When**: `deleteByThreadId("thread-x")`
- **Then**: Returns 0, storage unchanged

### CR3: Only delete matching thread comments
- **Given**: Comments for thread-1 (2) and thread-2 (3) exist
- **When**: `deleteByThreadId("thread-1")`
- **Then**: Returns 2, thread-2 comments still exist

### CR4: Persistence after delete
- **Given**: Comments deleted for thread-1
- **When**: `findByThreadId("thread-1")`
- **Then**: Returns empty array

## Dependencies

- Task 4 (ICommentRepository interface)
