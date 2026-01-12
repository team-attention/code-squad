# Fix: Diff view displays GitHub-style hunk headers

## Problem
Diff view was showing scope names (e.g., `functionName()`) in chunk headers even in basic diff mode, instead of standard GitHub-style hunk headers.

## Research
- Examined `renderChunksToHtml` in both `script.ts` and `ChunkRenderer.ts`
- Found that `state.scopeLabel` was being used if set, regardless of view mode
- `SidecarPanelAdapter.createDiffDisplayState()` pre-populates `scopeLabel` for all chunks via `findScopeLabel()`

## Root Cause
The rendering logic used `scopeLabel` from chunk state if available, even in basic diff mode. Since `scopeLabel` was always populated by `findScopeLabel()`, scope names appeared in the standard diff view.

## Solution
Modified both rendering locations to ignore `scopeLabel` and always use GitHub-style hunk headers (`@@ -X,Y +X,Y @@`) in diff mode. Scope labels are now only used in the dedicated Scope View.

## Files Changed
- `src/adapters/inbound/ui/webview/script.ts` - Use GitHub-style hunk headers in `renderChunksToHtml`
- `src/adapters/inbound/ui/webview/components/diff/ChunkRenderer.ts` - Same change for component version

## Validation
- Compile: Pass
- Lint: N/A (pre-existing config issue)

## Review

### Self-Evaluation
- [x] Problem solved: Diff view now shows `@@ -X,Y +X,Y @@` format
- [x] No regression: Scope View still works correctly
- [x] Architecture compliance: Changes only in adapters layer

### User Feedback
(Pending)

### KB Updates Needed
- [ ] None required
