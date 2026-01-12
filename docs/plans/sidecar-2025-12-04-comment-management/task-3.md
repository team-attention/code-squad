# Task 3: Message Handlers & DI Wiring

**Phase**: 1 - Comment Lifecycle
**Dependencies**: Task 2
**Files**: 2

## Objective

Add message handlers for edit/delete in `SidecarPanelAdapter` and wire up new use cases in `extension.ts`.

## Files to Modify

### 1. `src/extension.ts`

Add DI wiring for new use cases:

```typescript
// Import new use cases
import { EditCommentUseCase } from './application/useCases/EditCommentUseCase';
import { DeleteCommentUseCase } from './application/useCases/DeleteCommentUseCase';

// In activate() function, after existing use case instantiation:
const editCommentUseCase = new EditCommentUseCase(commentRepository);
const deleteCommentUseCase = new DeleteCommentUseCase(commentRepository);

// Pass to SidecarPanelAdapter constructor (update constructor signature)
const sidecarPanelAdapter = new SidecarPanelAdapter(
  context,
  panelStateManager,
  addCommentUseCase,
  submitCommentsUseCase,
  generateDiffUseCase,
  editCommentUseCase,      // NEW
  deleteCommentUseCase,    // NEW
  vscodeGitGateway,
  vscodeFileSystemGateway,
  notificationGateway
);
```

### 2. `src/adapters/inbound/ui/SidecarPanelAdapter.ts`

#### Update Constructor

```typescript
import { IEditCommentUseCase } from '../../../application/ports/inbound/IEditCommentUseCase';
import { IDeleteCommentUseCase } from '../../../application/ports/inbound/IDeleteCommentUseCase';

export class SidecarPanelAdapter {
  constructor(
    // existing params...
    private readonly editCommentUseCase: IEditCommentUseCase,
    private readonly deleteCommentUseCase: IDeleteCommentUseCase,
    // existing params...
  ) {}
}
```

#### Add Message Handlers

In the `handleMessage()` method switch statement:

```typescript
case 'editComment': {
  const { id, text } = message;
  const updated = await this.editCommentUseCase.execute({ id, text });
  if (updated) {
    // Update in panel state
    this.panelStateManager.updateComment({
      id: updated.id,
      file: updated.file,
      line: updated.line,
      endLine: updated.endLine,
      text: updated.text,
      isSubmitted: updated.isSubmitted,
      codeContext: updated.codeContext,
      timestamp: updated.timestamp,
    });
  }
  break;
}

case 'deleteComment': {
  const { id } = message;
  const deleted = await this.deleteCommentUseCase.execute({ id });
  if (deleted) {
    this.panelStateManager.removeComment(id);
  }
  break;
}
```

### 3. `src/application/services/PanelStateManager.ts`

Add `updateComment()` method:

```typescript
updateComment(comment: CommentInfo): void {
  const index = this.state.comments.findIndex(c => c.id === comment.id);
  if (index !== -1) {
    this.state.comments[index] = comment;
    this.render();
  }
}
```

## Message Type Definitions

Update webview message types (in adapter or shared types file):

```typescript
type WebviewMessage =
  // existing...
  | { type: 'editComment'; id: string; text: string }
  | { type: 'deleteComment'; id: string }
```

## Architecture Compliance

- [ ] `extension.ts` creates use case instances with repository injection
- [ ] `SidecarPanelAdapter` receives use cases via constructor (DI)
- [ ] Adapter calls use cases, not repository directly
- [ ] Panel state manager handles UI state updates

## Validation

- [ ] `extension.ts` compiles with new use cases
- [ ] `SidecarPanelAdapter` constructor updated
- [ ] `editComment` message handler works
- [ ] `deleteComment` message handler works
- [ ] `PanelStateManager.updateComment()` method added
- [ ] TypeScript compiles without errors

## Test Scenarios

1. Send `editComment` message → comment updated in state and file
2. Send `deleteComment` message → comment removed from state and file
3. Edit non-existent comment → no state change
4. Delete non-existent comment → no state change
