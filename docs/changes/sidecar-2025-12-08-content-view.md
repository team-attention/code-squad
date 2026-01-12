# Content View Integration - Implementation Summary

## Date
2025-12-09

## Summary
Integrated content viewing (HN articles, external URLs) into Sidecar's main panel `.main-content` area, replacing the separate webview panel approach. Content views now coexist at the same hierarchy level as diff/scope/preview views.

## Changes Made

### Task 1: Domain & Application Layer
- Added `ContentViewState` interface to `src/application/ports/outbound/PanelState.ts`
- Extended `PanelState` with `contentView: ContentViewState | null` field
- Updated `createInitialPanelState()` to include `contentView: null`
- Added `openContentView()` and `closeContentView()` methods to `IPanelStateManager.ts`
- Implemented methods in `PanelStateManager.ts`
- Modified `selectFile()` to auto-close content view when selecting a file

### Task 2: Webview Component
- Created `src/adapters/inbound/ui/webview/components/content/ContentView.ts`
  - `renderContentView()` - renders iframe with loading/error states
  - `renderContentViewHeader()` - renders header with title and navigation buttons
- Created barrel export at `components/content/index.ts`
- Updated `components/index.ts` to export content view components
- Added content view styles to `styles.ts` (~120 lines)
- Added `renderContentViewState()` function to `script.ts`
- Updated `renderState()` to check for content view first and route appropriately

### Task 3: Message Handling Integration
- Added message handlers in `SidecarPanelAdapter.ts`:
  - `openContentView` - calls `panelStateManager.openContentView()`
  - `closeContentView` - calls `panelStateManager.closeContentView()`
  - `openContentExternal` - opens URL in system browser via `vscode.env.openExternal()`
- Updated `openHNStoryInPanel` handler to use new content view system

### Task 4: Migration & Cleanup
- Removed `articlePanel` property from `SidecarPanelAdapter`
- Removed `openArticleInWebview()` method
- Removed `getArticleWebviewContent()` method
- Updated `dispose()` method to remove article panel cleanup
- Verified no remaining references to old code

## Files Modified
- `src/application/ports/outbound/PanelState.ts` - Added ContentViewState, extended PanelState
- `src/application/services/IPanelStateManager.ts` - Added interface methods
- `src/application/services/PanelStateManager.ts` - Implemented methods
- `src/adapters/inbound/ui/SidecarPanelAdapter.ts` - Added handlers, removed old code
- `src/adapters/inbound/ui/webview/script.ts` - Added content view rendering
- `src/adapters/inbound/ui/webview/styles.ts` - Added content view styles
- `src/adapters/inbound/ui/webview/components/index.ts` - Added exports

## Files Created
- `src/adapters/inbound/ui/webview/components/content/ContentView.ts`
- `src/adapters/inbound/ui/webview/components/content/index.ts`

## Architecture Notes
- Content view state is managed at the application layer (`PanelStateManager`)
- Content view takes precedence over other views in `renderState()` routing
- File selection auto-closes content view for immediate transition
- Message protocol follows existing patterns (webview -> extension -> state manager -> render)

## Testing
- Compilation passes (`npm run compile`)
- ESLint configuration issue is pre-existing (not caused by these changes)
- Manual testing required for E2E verification (Task 5)

## Manual Test Instructions
1. Start extension in debug mode (F5)
2. Open terminal, trigger AI detection
3. Click HN story - should open in main panel area
4. Click "Back" - should return to previous view
5. Click "Open in Browser" - should open system browser
6. Select file while content view open - should close and show diff

## Review

### Evaluation
- ❌ Spec compliance - FR-3 (navigation) not working: Back button broken
- ✅ Architecture compliance - Clean layer separation maintained
- ✅ TypeScript compilation passes
- ✅ Build succeeds
- ⚠️ Lint skipped (ESLint config missing - pre-existing issue)
- ⚠️ Tests skipped (blocked by lint)

### User Feedback
- Evaluation: Needs improvement
- Issue: Back button not working

### Bug Found: Header Structure Corruption

**Root Cause**: When content view opens, `renderContentViewState()` replaces `viewerHeader.innerHTML` completely. When content view closes, the original header structure is never restored.

**Analysis**:
1. Content view replaces header with custom structure:
   ```html
   <span class="diff-header-icon">🌐</span>
   <span class="diff-header-title content-title">...</span>
   <div class="content-view-actions">
     <button id="content-back-btn">← Back</button>
     <button id="content-external-btn">↗ Open in Browser</button>
   </div>
   ```

2. After Back button is clicked, `closeContentView()` triggers re-render

3. `renderDiff()` or `renderWaitingScreen()` only modify specific elements:
   - `header.textContent` - changes title text only
   - `stats.innerHTML` - changes stats area
   - `.content-view-actions` buttons remain in DOM!

4. Original structure never restored:
   ```html
   <span class="diff-header-icon">📄</span>
   <span class="diff-header-title">...</span>
   <div class="diff-stats" id="diff-stats"></div>
   <button class="sidebar-toggle" id="toggle-sidebar">...</button>
   ```

**Result**: After opening content view once, `#toggle-sidebar` button is permanently lost.

### Additional Issue

`components/index.ts` exports from `'./content'` but `components/content/` directory exists (not `./content.ts`). Export path may be incorrect or the module structure doesn't match.

### Feedback
- What went well:
  - Clean state management in application layer
  - Memory efficiency improved (removed separate webview panel)
  - Good separation of rendering logic
- What could be improved:
  - Header structure management needs proper state restoration
  - Should test navigation flows end-to-end before completion

### Friction
- None discovered during review

### Next Actions
1. Fix header restoration when content view closes
   - Option: Restore original header structure before calling other render functions
2. Verify export path in `components/index.ts`
3. Test complete flow: open content view → back button → verify header restored
4. Test: open content view → select file → verify content view closes cleanly
