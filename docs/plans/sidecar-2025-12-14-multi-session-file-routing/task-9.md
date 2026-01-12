# Task 9: Wire Dependencies in extension.ts

## Goal

Wire all new components in the dependency injection setup.

## Layer

Entry Point

## Files

- `src/extension.ts` - Update DI wiring

## Implementation Steps

### 1. Create Repository Instance

```typescript
// After other repository instantiations (around line 60-80)
const fileThreadMappingRepository = new InMemoryFileThreadMappingRepository();
```

### 2. Create TrackFileOwnershipUseCase

```typescript
// After other use case instantiations (around line 100-120)
const trackFileOwnershipUseCase = new TrackFileOwnershipUseCase(
    fileThreadMappingRepository
);
```

### 3. Update FileWatchController Instantiation

```typescript
// Update FileWatchController constructor call
const fileWatchController = new FileWatchController(
    // ... existing dependencies
    trackFileOwnershipUseCase  // NEW
);
```

### 4. Update SubmitCommentsUseCase Instantiation

```typescript
// Update SubmitCommentsUseCase constructor call
const submitCommentsUseCase = new SubmitCommentsUseCase(
    commentRepository,
    terminalGateway,
    notificationGateway,
    fileThreadMappingRepository,  // NEW
    threadStateRepository         // NEW
);
```

### 5. Update PanelStateManager Instantiation

```typescript
// Update PanelStateManager constructor call
const panelStateManager = new PanelStateManager(
    // ... existing dependencies
    fileThreadMappingRepository,  // NEW
    threadStateRepository         // NEW
);
```

### 6. Add Imports

```typescript
import { InMemoryFileThreadMappingRepository } from './infrastructure/repositories/InMemoryFileThreadMappingRepository';
import { TrackFileOwnershipUseCase } from './application/useCases/TrackFileOwnershipUseCase';
```

## Test Scenarios

None - Integration wiring. Verified through end-to-end testing.

## Verification Steps

1. Build the extension: `npm run compile`
2. Run the extension in debug mode
3. Create two threads
4. Modify different files in each thread
5. Verify:
   - File ownership is tracked (check via debugging)
   - Comments route to correct threads
   - Thread badges appear in UI

## Validation

- [ ] All new components instantiated
- [ ] Dependencies properly injected
- [ ] Type check passes
- [ ] Build succeeds
- [ ] Extension loads without errors
- [ ] Manual e2e testing passes
