# Task 3: Message Handling Integration

## Objective

Add message handlers in SidecarPanelAdapter to handle content view open/close messages and wire up PanelStateManager methods.

## Files to Modify

### 1. `src/adapters/inbound/ui/SidecarPanelAdapter.ts`

**Add message handlers in constructor's onDidReceiveMessage:**
```typescript
// In the switch(message.type) block:

case 'openContentView':
    this.panelStateManager?.openContentView(message.url, message.title);
    break;

case 'closeContentView':
    this.panelStateManager?.closeContentView();
    break;

case 'openContentExternal':
    vscode.env.openExternal(vscode.Uri.parse(message.url));
    break;
```

**Update selectFile handler to close content view:**
```typescript
case 'selectFile':
    // Content view auto-closes via PanelStateManager.selectFile
    await this.handleSelectFile(message.file);
    break;
```

Note: PanelStateManager.selectFile already clears contentView (from Task 1), so no additional logic needed here.

**Update openHNStoryInPanel handler:**
```typescript
case 'openHNStoryInPanel':
    // Use new content view system instead of separate panel
    this.panelStateManager?.openContentView(message.url, message.title);
    break;
```

### 2. `src/adapters/inbound/ui/webview/script.ts`

**Update HN story click handler to use new message type:**

Find the existing HN story click handler that posts `openHNStoryInPanel` and ensure it sends:
```typescript
vscode.postMessage({
    type: 'openHNStoryInPanel',
    url: story.url,
    title: story.title
});
```

This existing message type will now route through the new content view system via the updated handler in SidecarPanelAdapter.

## Test Scenarios

### TS-3.1: openContentView message triggers state update
**Given:** Sidecar panel open, no content view
**When:** Webview posts { type: 'openContentView', url: '...', title: '...' }
**Then:** PanelStateManager.openContentView() called, state updated, render triggered

### TS-3.2: closeContentView message clears state
**Given:** Content view displayed
**When:** Webview posts { type: 'closeContentView' }
**Then:** PanelStateManager.closeContentView() called, contentView becomes null

### TS-3.3: openContentExternal opens system browser
**Given:** Content view displayed
**When:** Webview posts { type: 'openContentExternal', url: 'https://...' }
**Then:** vscode.env.openExternal() called with URL

### TS-3.4: selectFile auto-closes content view
**Given:** Content view displayed
**When:** Webview posts { type: 'selectFile', file: 'path/to/file' }
**Then:** Content view closes AND diff view shows for selected file

### TS-3.5: HN story click uses content view
**Given:** Waiting screen with HN stories
**When:** User clicks HN story
**Then:** Content view opens with story URL and title

## Integration Flow

```
[User clicks HN story]
    │
    ▼
[script.ts: HN item click handler]
    │ vscode.postMessage({ type: 'openHNStoryInPanel', url, title })
    ▼
[SidecarPanelAdapter: onDidReceiveMessage]
    │ case 'openHNStoryInPanel':
    │     this.panelStateManager?.openContentView(url, title)
    ▼
[PanelStateManager: openContentView]
    │ this.state = { ...state, contentView: { url, title } }
    │ this.triggerRender()
    ▼
[SidecarPanelAdapter: render callback]
    │ panel.webview.postMessage({ type: 'render', state })
    ▼
[script.ts: message handler]
    │ renderState(state)
    ▼
[script.ts: renderContentViewState]
    │ Shows iframe with content
    ▼
[Content Displayed]
```

## Verification

```bash
npm run compile
npm run lint
```

Manual test:
1. Open Sidecar panel
2. Wait for HN feed to load
3. Click on an HN story
4. Verify content loads in main panel (not separate panel)
5. Click Back button
6. Verify returns to previous view

## Acceptance Criteria

- [ ] openContentView message handler added
- [ ] closeContentView message handler added
- [ ] openContentExternal message handler added
- [ ] openHNStoryInPanel now uses content view system
- [ ] selectFile continues to work, auto-closes content view
- [ ] Code compiles without errors
- [ ] Lint passes
- [ ] Manual test passes
