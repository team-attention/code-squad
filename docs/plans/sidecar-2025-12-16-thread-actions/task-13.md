# Task 13: DI Wiring - Wire Use Cases in extension.ts

## Goal

Wire up the new use cases and update controller instantiation in extension.ts.

## Location

`src/extension.ts`

## Changes

### Import New Use Cases

```typescript
import { DeleteThreadUseCase } from './application/useCases/DeleteThreadUseCase';
import { RenameThreadUseCase } from './application/useCases/RenameThreadUseCase';
import { SwitchThreadBranchUseCase } from './application/useCases/SwitchThreadBranchUseCase';
import { IDeleteThreadUseCase } from './application/ports/inbound/IDeleteThreadUseCase';
import { IRenameThreadUseCase } from './application/ports/inbound/IRenameThreadUseCase';
import { ISwitchThreadBranchUseCase } from './application/ports/inbound/ISwitchThreadBranchUseCase';
```

### Instantiate Use Cases

```typescript
// After existing use case instantiation
const deleteThreadUseCase = new DeleteThreadUseCase(
  threadStateRepository,
  terminalGateway,
  gitGateway,
  commentRepository,
  detectStatusUseCase
);

const renameThreadUseCase = new RenameThreadUseCase(
  threadStateRepository,
  terminalGateway,
  detectStatusUseCase
);

const switchThreadBranchUseCase = new SwitchThreadBranchUseCase(
  threadStateRepository,
  gitGateway
);
```

### Update ThreadListController Instantiation

```typescript
const threadListController = new ThreadListController(
  // ... existing deps
  deleteThreadUseCase,
  renameThreadUseCase,
  switchThreadBranchUseCase,
  gitGateway
);
```

## Dependency Order

Ensure instantiation order respects dependencies:

1. Repositories (threadStateRepository, commentRepository)
2. Gateways (terminalGateway, gitGateway)
3. Detect status use case
4. New use cases (delete, rename, switch)
5. Controllers

## Test Scenarios

### DI1: Extension activates without error
- **When**: Extension activates
- **Then**: No instantiation errors

### DI2: Delete thread action works end-to-end
- **When**: User clicks delete on thread
- **Then**: Confirmation → deletion → refresh

### DI3: Rename thread action works end-to-end
- **When**: User clicks rename on thread
- **Then**: Input box → rename → refresh

### DI4: Switch branch action works end-to-end
- **When**: User clicks branch on worktree thread
- **Then**: Quick pick → switch → refresh

## Dependencies

- Task 8 (DeleteThreadUseCase)
- Task 9 (RenameThreadUseCase)
- Task 10 (SwitchThreadBranchUseCase)
- Task 11 (ThreadListController)
