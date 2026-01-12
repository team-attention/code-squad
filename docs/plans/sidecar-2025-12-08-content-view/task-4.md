# Task 4: Migration and Cleanup

## Objective

Remove the separate article webview panel implementation and ensure all external content uses the new integrated content view system.

## Files to Modify

### 1. `src/adapters/inbound/ui/SidecarPanelAdapter.ts`

**Remove articlePanel property:**
```typescript
// REMOVE:
private articlePanel: vscode.WebviewPanel | undefined;
```

**Remove openArticleInWebview method:**
```typescript
// REMOVE entire method:
private openArticleInWebview(url: string, title: string): void {
    // ... entire implementation
}
```

**Remove getArticleWebviewContent method:**
```typescript
// REMOVE entire method:
private getArticleWebviewContent(url: string, title: string): string {
    // ... entire implementation
}
```

**Update dispose method to remove articlePanel cleanup:**
```typescript
// In dispose():
// REMOVE:
if (this.articlePanel) {
    this.articlePanel.dispose();
}
```

**Verify message handler uses new system:**
```typescript
// The openHNStoryInPanel handler should now be:
case 'openHNStoryInPanel':
    this.panelStateManager?.openContentView(message.url, message.title);
    break;

// NOT:
case 'openHNStoryInPanel':
    this.openArticleInWebview(message.url, message.title);
    break;
```

### 2. Verify No Other References

Search codebase for any remaining references to:
- `articlePanel`
- `openArticleInWebview`
- `getArticleWebviewContent`
- `sidecarArticle` (webview panel ID)

## Test Scenarios

### TS-4.1: No separate panel created
**Given:** User clicks HN story
**When:** Content loads
**Then:** Only single Sidecar panel exists (no second panel)

### TS-4.2: Article panel property removed
**Given:** SidecarPanelAdapter instance
**When:** Inspecting properties
**Then:** articlePanel property does not exist

### TS-4.3: Cleanup doesn't reference articlePanel
**Given:** SidecarPanelAdapter with content view open
**When:** dispose() called
**Then:** No errors, clean disposal (no articlePanel reference)

### TS-4.4: Build has no dead code
**Given:** All changes applied
**When:** Running compile
**Then:** No unused variable/method warnings related to article panel

## Verification

```bash
npm run compile
npm run lint

# Search for any remaining references
grep -r "articlePanel" src/
grep -r "openArticleInWebview" src/
grep -r "getArticleWebviewContent" src/
grep -r "sidecarArticle" src/
```

All grep commands should return no results.

## Manual Integration Test

1. Start extension in debug mode
2. Open terminal and run `claude` (or trigger AI detection)
3. Wait for Sidecar panel to open
4. When HN feed loads, click on a story
5. **Verify**: Content opens in same panel's main area (not separate panel)
6. **Verify**: Only one panel in ViewColumn.Two
7. Click "Back" button
8. **Verify**: Returns to previous view (waiting screen or diff)
9. Select a file from sidebar
10. **Verify**: If content view was open, it closes and shows diff
11. Close Sidecar panel
12. **Verify**: Clean disposal, no errors in console

## Acceptance Criteria

- [ ] articlePanel property removed
- [ ] openArticleInWebview method removed
- [ ] getArticleWebviewContent method removed
- [ ] dispose() cleanup updated
- [ ] No references to removed code remain
- [ ] Code compiles without errors
- [ ] Lint passes
- [ ] grep searches return empty
- [ ] Manual integration test passes

## Rollback Plan

If issues discovered:
1. Revert changes to SidecarPanelAdapter.ts
2. Keep both systems temporarily
3. Add deprecation warning to old method
4. Debug new system before removing old
