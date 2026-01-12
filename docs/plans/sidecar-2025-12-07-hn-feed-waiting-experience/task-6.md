# Task 6: Add Message Handlers for Internal Navigation

**Layer**: Adapters (UI)
**Dependencies**: Task 5

## Goal

Add message handler for `openHNStoryInPanel` to open articles internally, and update webview script to send the correct message.

## Files to Modify

| File | Changes |
|------|---------|
| `src/adapters/inbound/ui/SidecarPanelAdapter.ts` | Add `openHNStoryInPanel` message handler |
| `src/adapters/inbound/ui/webview/script.ts` | Update `openHNStory` to send panel message |

## Test Scenarios

### TS-6.1: Click Story Opens in Panel
- **Given** user clicks HN story title
- **When** message is received by extension
- **Then** article opens in WebviewPanel (not external browser)

### TS-6.2: Open in Browser Option
- **Given** user clicks "Open in Browser" in article panel
- **When** clicked
- **Then** opens in external browser via vscode.env.openExternal

### TS-6.3: Back Button Closes Panel
- **Given** article panel is open
- **When** user clicks back
- **Then** article panel closes

## Implementation Guidance

### 1. Add Message Handler in SidecarPanelAdapter

In `src/adapters/inbound/ui/SidecarPanelAdapter.ts`, find the message handling switch statement (around line 240) and add a new case:

```typescript
case 'openHNStoryInPanel':
  this.openArticleInWebview(message.url, message.title);
  break;
```

### 2. Update HN Story Click Handler in script.ts

Find the existing `openHNStory` function and modify it:

**Before** (around line 2700):
```typescript
(window as any).openHNStory = function(url: string) {
  vscode.postMessage({ type: 'openHNStory', url });
};
```

**After**:
```typescript
(window as any).openHNStory = function(url: string, title: string) {
  vscode.postMessage({ type: 'openHNStoryInPanel', url, title });
};
```

### 3. Update renderHNStory to Pass Title

Find the `renderHNStory()` function and update the onclick handler to pass the title:

**Before**:
```typescript
onclick="openHNStory('${story.url}')"
```

**After**:
```typescript
onclick="openHNStory('${story.url}', '${escapeHtml(story.title)}')"
```

Also add for discussion link:
```typescript
onclick="openHNStory('${story.discussionUrl}', '${escapeHtml(story.title)} - HN Discussion')"
```

### 4. Ensure escapeHtml is Available

If not already available in script.ts, add:

```typescript
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

### 5. Keep Original openHNStory Handler for Fallback

Keep the original `openHNStory` handler in SidecarPanelAdapter as fallback (it opens in external browser):

```typescript
case 'openHNStory':
  // Fallback to external browser
  vscode.env.openExternal(vscode.Uri.parse(message.url));
  break;

case 'openHNStoryInPanel':
  // Open in internal WebviewPanel
  this.openArticleInWebview(message.url, message.title);
  break;
```

## Message Flow

```
User clicks story title in webview
      |
script.ts: openHNStory(url, title)
      |
vscode.postMessage({ type: 'openHNStoryInPanel', url, title })
      |
SidecarPanelAdapter receives message
      |
case 'openHNStoryInPanel': this.openArticleInWebview(url, title)
      |
New WebviewPanel opens with iframe showing article
```

## Validation

```bash
npm run compile
npm run lint
```

Manual test:
1. Activate Sidecar panel with HN feed visible
2. Click an HN story title
3. Verify new WebviewPanel opens beside editor
4. Verify article content loads in iframe
5. Click "Back" button
6. Verify panel closes
7. Click another story
8. Click "Open in Browser"
9. Verify opens in external browser
