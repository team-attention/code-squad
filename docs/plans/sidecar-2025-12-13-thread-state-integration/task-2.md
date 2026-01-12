# Task 2: Add setComments to IPanelStateManager

## Goal

Add method to bulk-set comments in panel state for efficient thread switching.

## Locations

- `src/application/services/IPanelStateManager.ts` (interface)
- `src/application/services/PanelStateManager.ts` (implementation)

## Changes

### 1. Add to IPanelStateManager Interface

Add after `findCommentById` method (around line 50):

```typescript
/**
 * Set all comments (replaces existing comments).
 * Used when switching threads to show only that thread's comments.
 * @param comments The comments to display
 */
setComments(comments: CommentInfo[]): void;
```

### 2. Implement in PanelStateManager

Add after `findCommentById` method (around line 406):

```typescript
setComments(comments: CommentInfo[]): void {
    this.state = {
        ...this.state,
        comments: [...comments],
    };
    this.render();
}
```

## Test Scenario

**TS2: Thread Selection Filters Comments**

```typescript
// Given: Thread A has 2 comments, Thread B has 3 comments
const threadAComments = [
    { id: '1', file: 'a.ts', line: 1, text: 'Comment 1', threadId: 'thread-a' },
    { id: '2', file: 'a.ts', line: 5, text: 'Comment 2', threadId: 'thread-a' },
];

// When: User selects Thread A
stateManager.setComments(threadAComments);

// Then: Only Thread A's 2 comments are shown
expect(stateManager.getState().comments).toHaveLength(2);
expect(stateManager.getState().comments[0].id).toBe('1');
```

## Acceptance Criteria

- [ ] `setComments(comments)` replaces all comments in state
- [ ] State change triggers render
- [ ] Existing comments are fully replaced (not merged)
