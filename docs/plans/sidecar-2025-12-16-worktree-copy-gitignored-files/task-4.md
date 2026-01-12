# Task 4: Add worktreeCopyPatterns to CreateThreadInput

## Goal

Extend CreateThreadInput interface to include optional `worktreeCopyPatterns` property.

## Files to Modify

- `src/application/ports/inbound/ICreateThreadUseCase.ts`

## Implementation

```typescript
export interface CreateThreadInput {
    name: string;
    isolationMode: IsolationMode;
    branchName?: string;
    worktreePath?: string;
    workspaceRoot: string;
    worktreeCopyPatterns?: string[];  // NEW
}
```

## Acceptance Criteria

- [ ] `worktreeCopyPatterns?: string[]` added to CreateThreadInput
- [ ] Property is optional (existing callers not broken)
