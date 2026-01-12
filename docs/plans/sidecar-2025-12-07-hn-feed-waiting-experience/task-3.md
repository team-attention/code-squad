# Task 3: Create Waiting Animation CSS Styles

**Layer**: Adapters (UI/webview)
**Dependencies**: None

## Goal

Add CSS styles for the waiting animation (rotating spinner) and the "Meanwhile" separator.

## Files to Modify

| File | Changes |
|------|---------|
| `src/adapters/inbound/ui/webview/styles.ts` | Add waiting animation CSS |

## Test Scenarios

### TS-3.1: Smooth Rotation Animation
- **Given** waiting screen is rendered
- **When** animation plays
- **Then** spinner characters should rotate smoothly at ~1.2s interval

### TS-3.2: Theme Compatibility
- **Given** dark/light theme
- **When** waiting screen displays
- **Then** colors should use VSCode CSS variables

## Implementation Guidance

Add new CSS classes in `src/adapters/inbound/ui/webview/styles.ts` (around line 1765, after HN feed styles):

```css
/* Waiting State Styles */
.waiting-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 16px;
  text-align: center;
}

.waiting-animation {
  font-size: 32px;
  line-height: 1;
  margin-bottom: 12px;
  animation: waiting-rotate 1.2s steps(4, end) infinite;
}

@keyframes waiting-rotate {
  0% { content: '◐'; }
  25% { content: '◓'; }
  50% { content: '◑'; }
  75% { content: '◒'; }
  100% { content: '◐'; }
}

/* Alternative: Use transform for smoother animation */
.waiting-spinner {
  display: inline-block;
  width: 24px;
  height: 24px;
  border: 2px solid var(--vscode-foreground);
  border-top-color: transparent;
  border-radius: 50%;
  animation: waiting-spin 1s linear infinite;
}

@keyframes waiting-spin {
  to { transform: rotate(360deg); }
}

.waiting-message {
  font-size: 14px;
  color: var(--vscode-descriptionForeground);
  margin-bottom: 24px;
}

.meanwhile-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  margin: 16px 0;
  color: var(--vscode-descriptionForeground);
  font-size: 12px;
}

.meanwhile-divider::before,
.meanwhile-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--vscode-widget-border);
}

.waiting-feed-container {
  width: 100%;
  max-height: 60vh;
  overflow-y: auto;
}

.waiting-refresh-btn {
  margin-top: 16px;
  padding: 6px 12px;
  background: transparent;
  border: 1px solid var(--vscode-button-border, var(--vscode-contrastBorder));
  color: var(--vscode-foreground);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.waiting-refresh-btn:hover {
  background: var(--vscode-list-hoverBackground);
}
```

## Key Style Decisions

1. **Animation Type**: Two options provided:
   - Character rotation (◐ ◓ ◑ ◒) - simpler, text-based
   - CSS spinner - smoother, more standard

2. **Colors**: Use VSCode CSS variables for theme compatibility:
   - `--vscode-foreground` for text
   - `--vscode-descriptionForeground` for muted text
   - `--vscode-widget-border` for divider lines

3. **Spacing**: Generous padding for a clean, uncluttered look

## Validation

```bash
npm run compile
```

Verify styles are properly exported in the getWebviewStyles() function.
