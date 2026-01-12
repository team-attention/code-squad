# Fix: Diff view scroll and comment state persistence

## Problem
1. Scroll position resets when switching files in diff view
2. Comment input text cleared when clicking different line
3. Comment input lost when switching files
4. Need: Only clear comment form on explicit close (Cancel button)

## Research
Examined the following code:
- `PanelState.ts`: State interface with no scroll/draft comment fields
- `PanelStateManager.ts`: State management without UI-specific state persistence
- `SidecarPanelAdapter.ts`: Message handling without scroll/draft handlers
- `script.ts`: Webview logic where `showInlineCommentForm()` removes existing forms without saving content, and `renderState()` has no scroll position persistence across file switches

Root cause: Architecture uses state-driven UI model where PanelState is single source of truth, but critical UI state (scroll position, draft comments) existed only in DOM. When webview receives new state, it performs full diff viewer reconstruction via innerHTML, losing all transient UI state.

## Root Cause
1. **Scroll**: No scroll position storage. File switches triggered full re-render without saving/restoring scroll position.
2. **Comment form**: `showInlineCommentForm()` unconditionally removed existing form without saving textarea content.
3. **Cross-file persistence**: Draft comment state not stored in PanelState, so file switches lost form content.

## Solution
1. Added `DraftComment` and `FileScrollPositions` interfaces to PanelState
2. Added `draftComment` and `fileScrollPositions` fields to PanelState
3. Added `setDraftComment`, `clearDraftComment`, `setFileScrollPosition`, `getFileScrollPosition` methods to PanelStateManager
4. Added message handlers in SidecarPanelAdapter: `saveDraftComment`, `clearDraftComment`, `saveScrollPosition`
5. Modified webview script:
   - Track current file for scroll position saving
   - Save scroll position before file switch
   - Restore scroll position on file return
   - `showInlineCommentForm()` preserves existing text when switching lines
   - Added `saveDraftComment()` to save draft on textarea input
   - Added `restoreDraftCommentForm()` to restore draft after re-render
   - `cancelCommentForm()` clears draft (explicit close)
   - `submitInlineComment()` clears draft (after submit)

## Files Changed
- `src/application/ports/outbound/PanelState.ts` - Added DraftComment, FileScrollPositions interfaces and fields
- `src/application/services/IPanelStateManager.ts` - Added draft comment and scroll position method signatures
- `src/application/services/PanelStateManager.ts` - Implemented draft comment and scroll position methods
- `src/adapters/inbound/ui/SidecarPanelAdapter.ts` - Added message handlers
- `src/adapters/inbound/ui/webview/script.ts` - Scroll and draft comment persistence logic

## Validation
- [x] Compile
- [x] Tests (62 passing)
- [x] TypeScript type check

## Review

### Self-Evaluation
- [x] Problem solved - scroll position and comment form state now persist across file switches and line changes
- [x] No regression - all existing tests pass
- [x] Architecture compliance - changes follow hexagonal architecture pattern (state in application layer, UI logic in adapters)

### User Feedback
- Approved

### KB Updates Needed
- [x] None - this is a bug fix, no new patterns or rules discovered
