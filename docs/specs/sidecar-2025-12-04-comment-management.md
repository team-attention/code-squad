# Spec: Comment Management & Diff Integration

**Slug**: `sidecar-2025-12-04-comment-management`
**Created**: 2025-12-04
**Status**: Draft

## Problem Statement

Comments are disconnected from their code context. The sidebar shows a text list without visual connection to diff locations. Users cannot edit or delete pending comments, and submitted comments clutter the active list.

**Root cause**: Comments exist as sidebar text, not as anchored elements in the diff viewer.

## Requirements

### Phase 1: Comment Lifecycle

1. **Pending comments** (`isSubmitted: false`)
   - Editable: inline text editing in sidebar
   - Deletable: remove button on each comment
   - Display: prominent in sidebar

2. **Submit action**
   - Sends all pending comments to AI terminal
   - Clears pending comments from active list
   - Moves to submitted history (in-memory only)

3. **Submitted history**
   - Collapsed section at bottom of COMMENTS area
   - Header: "Submitted (N)" - click to expand
   - Read-only display
   - Session-scoped: cleared on VSCode restart (not persisted)

### Phase 2: Sidebar → Diff Navigation

4. **Click-to-navigate**
   - Click comment in sidebar → opens file's diff viewer
   - Scrolls to commented line
   - Highlights target line briefly (flash animation)

5. **Auto-expand sidebar**
   - When navigating to diff, expand sidebar if collapsed

### Phase 3: Inline Comments in Diff Viewer

6. **Inline comment display**
   - Comment boxes render below their target line in diff
   - Same visual style as comment input form, but read-only
   - Collapsible: gutter marker always visible, comment box can fold/unfold
   - Fold toggle on comment component itself ([▼]/[▶] button)
   - Shows: fold toggle, comment text, edit/delete buttons (if pending)

7. **Inline comment creation**
   - Click gutter icon to add comment on any line
   - Form appears inline below the line
   - Submit adds to pending comments

8. **Comment markers**
   - Left gutter indicator on commented region
   - Clicking marker toggles comment box visibility (fold/unfold)
   - Distinguish pending (blue) vs submitted (gray)

## Success Criteria

- [ ] Can edit pending comment text
- [ ] Can delete pending comments
- [ ] Submitted comments move to collapsed history section
- [ ] History clears on extension restart
- [ ] Click sidebar comment → navigates to diff location
- [ ] Diff viewer shows inline comment boxes
- [ ] Can add comments from diff gutter
- [ ] Smooth UX matching GitHub PR review experience

## Technical Notes

### Affected Layers

| Layer | Changes |
|-------|---------|
| Domain | Add `CommentHistory` entity for session-scoped submitted comments |
| Application | New `EditCommentUseCase`, `DeleteCommentUseCase`; modify `SubmitCommentsUseCase` to flush |
| Adapters | Update `SidecarPanelAdapter` message handlers; major webview script changes |
| Infrastructure | Modify `JsonCommentRepository` to only persist pending comments |

### Architecture Considerations

1. **Session-scoped history**: Use in-memory storage in `PanelStateManager`, not repository
2. **Navigation**: Add `navigateToComment` message type from webview
3. **Inline rendering**: Extend diff HTML generation to inject comment boxes
4. **Line anchoring**: Use existing `line`/`endLine` properties for positioning

### Data Model Changes

```typescript
// PanelState additions
interface PanelState {
  // existing...
  comments: CommentInfo[];        // Pending only (active)
  submittedHistory: CommentInfo[]; // Session-scoped, in-memory
}

// New message types
type WebviewMessage =
  | { type: 'editComment'; id: string; text: string }
  | { type: 'deleteComment'; id: string }
  | { type: 'navigateToComment'; id: string }
  // existing...
```

### UI Changes

**Sidebar COMMENTS section**:
```
COMMENTS (3)
├── [Edit] [Delete] src/app.ts:42
│   └── "Consider using async/await"
├── [Edit] [Delete] src/utils.ts:15-20
│   └── "Extract this to a helper"
└── ▶ Submitted (5)  ← collapsed by default
    └── (click to expand/collapse)
```

**Diff viewer with inline comments**:
```
@@ -10,6 +10,8 @@
      10 │   function getData() {
      11 │     const result = fetch(url);
  ●   12 │+    await result.json();       ← gutter marker (● = has comment)
         │ ┌─────────────────────────────────────────────┐
         │ │ [▼] Consider using try/catch here          │  ← [▼] fold toggle
         │ │ [Edit] [Delete]                            │
         │ └─────────────────────────────────────────────┘
      13 │     return data;

When collapsed (click ● or [▼] to toggle):
  ●   12 │+    await result.json();       ← only marker visible, box hidden
      13 │     return data;
```

**Fold/unfold triggers**:
- Click gutter marker (●)
- Click fold button ([▼]/[▶]) on comment component

## Open Questions

1. ~~Submitted history retention~~ → Session-only (cleared on restart)
2. ~~Inline comment gutter position~~ → Left gutter of commented region
3. ~~Animation duration for line highlight on navigation~~ → No animation needed

## Out of Scope

- Multi-user comment collaboration
- Comment threading/replies
- Persistent submitted history across sessions
- Comment search/filter

## References

- Brainstorm: `docs/brainstorms/sidecar-2025-12-04-comment-management.md`
- Architecture: `docs/rules/CLEAN_ARCHITECTURE.md`
