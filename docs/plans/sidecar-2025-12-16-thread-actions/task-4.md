# Task 4: ICommentRepository - Add deleteByThreadId

## Goal

Extend ICommentRepository interface with a method to delete all comments for a thread.

## Location

`src/application/ports/outbound/ICommentRepository.ts`

## Changes

Add the following method:

```typescript
/**
 * Delete all comments associated with a thread.
 * Used during thread cleanup.
 *
 * @param threadId - Thread ID to delete comments for
 * @returns Number of comments deleted
 */
deleteByThreadId(threadId: string): Promise<number>;
```

## Test Scenarios

Interface-only change - tests will be added in Task 7 (JsonCommentRepository implementation).

## Dependencies

None
