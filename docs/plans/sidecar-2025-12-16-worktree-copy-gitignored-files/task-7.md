# Task 7: Wire IFileSystemPort and IFileGlobber to CreateThreadUseCase

## Goal

Update extension.ts to inject IFileSystemPort and IFileGlobber into CreateThreadUseCase.

## Files to Modify

- `src/extension.ts`

## Implementation

Update CreateThreadUseCase instantiation (gateways already exist):

```typescript
// Existing gateway instances:
// const fileSystemGateway = new VscodeFileSystemGateway();
// const fileGlobber = new FastGlobGateway();

// Update CreateThreadUseCase instantiation:
const createThreadUseCase = new CreateThreadUseCase(
    threadStateRepository,
    terminalGateway,
    gitGateway,
    fileSystemGateway,  // NEW
    fileGlobber         // NEW
);
```

## Acceptance Criteria

- [ ] `fileSystemGateway` injected into CreateThreadUseCase
- [ ] `fileGlobber` injected into CreateThreadUseCase
- [ ] No new gateway instances created (reuse existing)
