# Implementation Plan: HN Feed Waiting Experience

**Slug**: `sidecar-2025-12-07-hn-feed-waiting-experience`
**Spec**: `docs/specs/sidecar-2025-12-07-hn-feed-waiting-experience.md`
**Size**: LARGE (8 tasks)

## Scope Summary

| Phase | Description | Tasks |
|-------|-------------|-------|
| Phase 1 | State Management Foundation | Task 1-2 |
| Phase 2 | Waiting Screen UI | Task 3-4 |
| Phase 3 | WebView Navigation | Task 5-6 |
| Phase 4 | Toggle & Auto-Transition | Task 7-8 |

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| WebView for HN articles | VSCode WebviewPanel (separate panel) | Stable, proper back navigation, independent lifecycle |
| Animation approach | CSS animations | Performant, no JS timer overhead |
| State for feed toggle | New `showHNFeed` boolean in PanelState | Simple, explicit state control |
| Auto-transition trigger | FileWatchController notification | Reuses existing file change detection |
| Feed display location | Main content area (replacing placeholder) | Consistent with current HN feed placement |

## Technical Design

### Data Flow for Waiting Screen

```
AI Session Starts
      |
AIDetectionController.activateSidecar()
      |
PanelStateManager.setAIStatus({ active: true })
      |
renderState() checks:
  - aiStatus.active === true
  - sessionFiles.length === 0 OR diff === null
  - showHNFeed === true (new state)
      |
Display Waiting Screen with Animation + HN Feed
```

### Auto-Transition Flow

```
File Change Detected
      |
FileWatchController.notifyFileChange()
      |
PanelStateManager.addSessionFile() / showDiff()
      |
renderState() detects sessionFiles.length > 0 AND diff !== null
      |
Auto-switch to Diff View
```

### WebView Panel Navigation

```
User clicks HN article title
      |
Webview sends 'openHNStoryInPanel' message
      |
SidecarPanelAdapter.handleOpenHNStoryInPanel()
      |
Create new WebviewPanel with article URL
      |
User clicks "Back" or closes panel
      |
Returns to Sidecar panel (still showing feed/diff)
```

### State Changes

```typescript
// New field in PanelState
interface PanelState {
  // ... existing fields ...
  showHNFeed: boolean;  // NEW: Toggle for feed view (when files exist)
}

// Waiting screen condition:
const shouldShowWaitingScreen =
  state.aiStatus.active &&
  (state.sessionFiles.length === 0 || state.showHNFeed);
```

## Task Overview

| Task | Description | Dependencies |
|------|-------------|--------------|
| 1 | Add `showHNFeed` state to PanelState | None |
| 2 | Add state manager methods for feed toggle | Task 1 |
| 3 | Create waiting animation CSS styles | None |
| 4 | Implement waiting screen renderer | Task 1, 3 |
| 5 | Create internal WebviewPanel for articles | None |
| 6 | Add message handlers for internal navigation | Task 5 |
| 7 | Implement feed/diff toggle button | Task 2, 4 |
| 8 | Wire auto-transition on file change | Task 1, 2 |

## Dependency Graph

```
Task 1 (showHNFeed State) ---+---> Task 2 (State Methods) ---> Task 7 (Toggle Button)
                            |                              /
                            +---> Task 4 (Waiting Screen) -+
                                     ^
Task 3 (Animation CSS) --------------+

Task 5 (WebviewPanel) ---> Task 6 (Message Handlers)

Task 1 + Task 2 ---> Task 8 (Auto-transition)
```

## Layer Changes

```
src/
├── application/
│   ├── ports/
│   │   └── outbound/
│   │       └── PanelState.ts              # Task 1: Add showHNFeed
│   └── services/
│       ├── IPanelStateManager.ts          # Task 2: Add toggle methods
│       └── PanelStateManager.ts           # Task 2: Implement toggle
│
└── adapters/
    └── inbound/
        ├── ui/
        │   ├── SidecarPanelAdapter.ts     # Task 5,6: WebView panel, handlers
        │   └── webview/
        │       ├── script.ts              # Task 4,7: Waiting screen, toggle
        │       └── styles.ts              # Task 3: Animation CSS
        └── controllers/
            └── FileWatchController.ts     # Task 8: Auto-transition
```

## Files

- [Task 1: Add showHNFeed State to PanelState](./task-1.md)
- [Task 2: Add State Manager Methods for Feed Toggle](./task-2.md)
- [Task 3: Create Waiting Animation CSS Styles](./task-3.md)
- [Task 4: Implement Waiting Screen Renderer](./task-4.md)
- [Task 5: Create Internal WebviewPanel for Articles](./task-5.md)
- [Task 6: Add Message Handlers for Internal Navigation](./task-6.md)
- [Task 7: Implement Feed/Diff Toggle Button](./task-7.md)
- [Task 8: Wire Auto-Transition on File Change](./task-8.md)

## Validation

After implementation:
1. `npm run compile` - No build errors
2. `npm run lint` - No lint errors
3. Manual test: Start AI session, verify waiting animation appears
4. Manual test: Verify HN feed loads in waiting screen
5. Manual test: Click article title, verify opens in WebviewPanel
6. Manual test: Click back button, verify returns to feed
7. Manual test: Modify a file, verify auto-transition to diff view
8. Manual test: Click "Feed" button in diff view, verify returns to feed
9. Manual test: Click file in list while in feed view, verify diff shows
10. Manual test: Refresh button fetches new stories

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| WebviewPanel CSP blocks external content | Articles don't load | Use iframe with sandboxed CSP |
| Animation performance on large feeds | UI stutters | Use CSS-only animations, limit visible items |
| Race condition on auto-transition | Flicker between views | Debounce state updates, check conditions |
| Memory leak from WebviewPanels | High memory usage | Track and dispose panels properly |
