# Implementation Plan: Comment Management & Diff Integration

**Slug**: `sidecar-2025-12-04-comment-management`
**Spec**: `docs/specs/sidecar-2025-12-04-comment-management.md`
**Size**: MEDIUM-LARGE
**Total Tasks**: 8
**Estimated Files**: 12-15

## Overview

Implement full comment lifecycle management with diff viewer integration. Comments become interactive elements: editable, deletable, navigable, and visible inline within the diff viewer.

## Architecture Layers Affected

| Layer | Changes |
|-------|---------|
| Domain | None (Comment entity already has `isSubmitted`) |
| Application | New use cases, port interface changes |
| Adapters | Major webview changes, new message handlers |
| Infrastructure | Repository method additions |

## Task Summary

### Phase 1: Comment Lifecycle

| Task | Description | Files |
|------|-------------|-------|
| 1 | Repository layer - add update/delete methods | 2 |
| 2 | Use cases - EditCommentUseCase, DeleteCommentUseCase | 4 |
| 3 | Message handlers + DI wiring | 2 |
| 4 | Sidebar UI - edit/delete buttons, submitted history | 2 |

### Phase 2: Sidebar → Diff Navigation

| Task | Description | Files |
|------|-------------|-------|
| 5 | Click-to-navigate - open diff, scroll to line | 2 |
| 6 | Line highlight animation | 1 |

### Phase 3: Inline Comments in Diff Viewer

| Task | Description | Files |
|------|-------------|-------|
| 7 | Gutter markers - comment indicators, fold toggle | 2 |
| 8 | Inline comment display - render boxes in diff | 2 |

## Dependencies

```
Task 1 → Task 2 → Task 3 → Task 4
                         ↓
                    Task 5 → Task 6
                         ↓
                    Task 7 → Task 8
```

- Tasks 1-3 must be sequential (infrastructure → application → adapters)
- Task 4 depends on Task 3 (message handlers)
- Tasks 5-6 can start after Task 4
- Tasks 7-8 can start after Task 5

## Key Files

### Modified
- `src/application/ports/outbound/ICommentRepository.ts`
- `src/infrastructure/repositories/JsonCommentRepository.ts`
- `src/application/services/PanelStateManager.ts`
- `src/adapters/inbound/ui/SidecarPanelAdapter.ts`
- `src/extension.ts`

### Created
- `src/application/ports/inbound/IEditCommentUseCase.ts`
- `src/application/ports/inbound/IDeleteCommentUseCase.ts`
- `src/application/useCases/EditCommentUseCase.ts`
- `src/application/useCases/DeleteCommentUseCase.ts`

## State Model Changes

```typescript
// PanelState additions
interface PanelState {
  comments: CommentInfo[];         // Active (pending) only
  submittedHistory: CommentInfo[]; // Session-scoped, in-memory
}

// New message types
type WebviewMessage =
  | { type: 'editComment'; id: string; text: string }
  | { type: 'deleteComment'; id: string }
  | { type: 'navigateToComment'; id: string }
  | { type: 'toggleCommentFold'; id: string }
```

## Success Criteria

- [ ] Can edit pending comment text inline
- [ ] Can delete pending comments
- [ ] Submitted comments move to collapsed history section
- [ ] History clears on extension restart (session-scoped)
- [ ] Click sidebar comment → navigates to diff location
- [ ] Diff viewer shows inline comment boxes below lines
- [ ] Can add comments from diff gutter click
- [ ] Gutter markers indicate commented lines (blue=pending, gray=submitted)
- [ ] Fold/unfold inline comments via gutter or button

## Next Step

Run: `/implement sidecar-2025-12-04-comment-management`
