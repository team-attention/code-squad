# Fix: Hide submitted comments in diff view

## Problem

Already submitted comments were still being displayed in the diff view (file view). The user expected that once comments are submitted to the AI, they should disappear from the file view since the content sent to the AI could differ from what's shown.

## Research

Examined the comment rendering flow:
- `App.ts:renderDiff()` - transforms comments for standard diff view
- `App.ts:renderScopedDiff()` - transforms comments for scoped diff view
- `App.ts:renderMarkdownPreview()` - transforms comments for markdown preview
- `ChunkRenderer.ts:renderChunksToHtml()` - renders comments inline with diff lines

Found that all three transform functions in `App.ts` were passing submitted comments through to the renderer without filtering them out.

## Root Cause

The comment transform logic in `App.ts` filtered comments by file but did not filter by `isSubmitted` status. This caused submitted comments to appear in the diff view with just a visual difference (a "submitted" label instead of edit/delete buttons).

## Solution

Added `!c.isSubmitted` filter condition to all three comment transformation locations:

1. `renderScopedDiff()` - line 458
2. `renderDiff()` - line 602
3. `renderMarkdownPreview()` - line 664

Submitted comments are now excluded from the file view entirely. They still appear in the sidebar under "Submitted Comments" for reference.

## Files Changed

- `src/adapters/inbound/ui/webview/core/App.ts` - Added `!c.isSubmitted` filter to three comment transformation locations

## Validation

- [x] Compile
- [x] Lint (no new warnings/errors)
- [ ] Tests (test runner file missing, pre-existing issue)

## Review

### Self-Evaluation

- [x] Problem solved - submitted comments no longer appear in diff view
- [x] No regression - pending comments still display correctly
- [x] Architecture compliance - change is localized to the webview layer

### User Feedback

{Pending user verification}

### KB Updates Needed

- [ ] None required
