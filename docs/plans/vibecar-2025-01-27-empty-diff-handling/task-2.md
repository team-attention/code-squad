# Task 2: Add removeFile() to IPanelPort

## Goal

Extend IPanelPort interface with method to remove file from Changed Files list.

## File

`src/application/ports/IPanelPort.ts`

## Implementation

Add method signature:

```typescript
export interface IPanelPort {
    show(): void;
    updateFileChanged(file: string): void;
    updateCommentAdded(comment: Comment): void;
    updateAIType(aiType: string): void;
    postDiff(file: string, diff: string): void;
    removeFile(file: string): void;  // NEW
}
```

## Acceptance Criteria

- [ ] Interface updated with `removeFile(file: string): void`
