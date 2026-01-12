# Content View Integration - Implementation Plan

## Summary

Integrate content viewing (HN articles, external URLs) into Sidecar's main panel `.main-content` area, replacing the separate webview panel approach. This provides a cohesive UX where content views coexist at the same hierarchy level as diff/scope/preview views.

## Technical Design

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    SidecarPanelAdapter                  │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Message Handlers                    │    │
│  │  'openContentView' → OpenContentViewUseCase      │    │
│  │  'closeContentView' → CloseContentViewUseCase    │    │
│  │  'selectFile' → auto-closes content view         │    │
│  └─────────────────────────────────────────────────┘    │
│                          │                              │
│                          ▼                              │
│  ┌─────────────────────────────────────────────────┐    │
│  │           PanelStateManager                      │    │
│  │  contentView: ContentViewState | null            │    │
│  │  openContentView(url, title)                     │    │
│  │  closeContentView()                              │    │
│  └─────────────────────────────────────────────────┘    │
│                          │                              │
│                          ▼ postMessage                  │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Webview (script.ts)                 │    │
│  │  renderState() → routes to renderContentView()   │    │
│  │  renderContentView() → iframe + header           │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### State Design

**New Interface: `ContentViewState`**
```typescript
export interface ContentViewState {
    url: string;
    title: string;
}
```

**PanelState Extension:**
```typescript
export interface PanelState {
    // ... existing fields
    contentView: ContentViewState | null;  // NEW
}
```

### View Routing Logic

```
renderState(state):
    if (state.contentView):
        renderContentView(state.contentView)
    else if (shouldShowWaiting):
        renderWaitingScreen(...)
    else if (diffViewMode === 'scope'):
        renderScopedDiff(...)
    else:
        renderDiff(...)
```

Content view takes precedence over other views. When active, the diff-header shows content title and navigation buttons instead of file path.

### Message Protocol

**New Messages:**
| Direction | Type | Payload |
|-----------|------|---------|
| Webview → Extension | `openContentView` | `{ url: string, title: string }` |
| Webview → Extension | `closeContentView` | (none) |
| Webview → Extension | `openContentExternal` | `{ url: string }` |

**Modified Behavior:**
- `selectFile` message: Auto-closes content view before selecting file

### File Changes

| File | Change Type | Description |
|------|-------------|-------------|
| `application/ports/outbound/PanelState.ts` | Modify | Add `ContentViewState` interface, extend `PanelState` |
| `application/services/PanelStateManager.ts` | Modify | Add content view state management methods |
| `adapters/inbound/ui/SidecarPanelAdapter.ts` | Modify | Add message handlers, remove `articlePanel` |
| `adapters/inbound/ui/webview/components/content/` | New | ContentView component |
| `adapters/inbound/ui/webview/script.ts` | Modify | Update `renderState()` routing, add content view rendering |
| `adapters/inbound/ui/webview/styles.ts` | Modify | Add content view styles |

### Open Questions Resolution

Based on spec recommendations:

1. **State management**: Option B - Separate `contentView: ContentViewState | null` field
2. **File selection behavior**: Option A - Immediate transition (auto-close content view)
3. **Migration**: Deprecate `openArticleInWebview()`, migrate HN story clicks to new system

## Task Breakdown

| Task | Description | Dependencies |
|------|-------------|--------------|
| Task 1 | Domain & Application Layer - ContentViewState, state manager methods | None |
| Task 2 | PanelState Extension - Add contentView field, update initial state | Task 1 |
| Task 3 | Webview Component - ContentView renderer with iframe, header, styles | Task 2 |
| Task 4 | Message Handling Integration - Adapter handlers, routing logic | Task 3 |
| Task 5 | Migration & Cleanup - Remove articlePanel, update HN triggers | Task 4 |

## Test Scenarios

### TS-1: Open Content View
**Given:** Sidecar panel is open with diff view showing
**When:** User clicks HN story link
**Then:** Content view replaces diff view, header shows content title with back button

### TS-2: Close Content View via Back Button
**Given:** Content view is displayed
**When:** User clicks back button
**Then:** Content view closes, previous view (diff or placeholder) is restored

### TS-3: Close Content View via File Selection
**Given:** Content view is displayed
**When:** User selects a file from sidebar
**Then:** Content view auto-closes, diff view shows for selected file

### TS-4: Open in External Browser
**Given:** Content view is displayed
**When:** User clicks "Open in Browser" button
**Then:** URL opens in system default browser, content view remains

### TS-5: Content Loading States
**Given:** Content view opening
**When:** URL is loading
**Then:** Loading spinner shown until iframe loads

### TS-6: Content Load Error
**Given:** Content view with invalid/blocked URL
**When:** iframe fails to load
**Then:** Error message displayed with retry/external browser options

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| iframe CSP blocking | Content won't display | Show fallback with "Open in Browser" option |
| State sync issues | View doesn't update | Add explicit state clearing on view transitions |
| Memory leaks | Performance degradation | Ensure proper cleanup when closing content view |

## Non-Goals

- Content search within iframe
- Multiple content tabs/history stack
- Content caching/offline support
- Comments on content
- Reader mode
