# Task 6: Line Highlight Animation

**Phase**: 2 - Sidebar → Diff Navigation
**Dependencies**: Task 5
**Files**: 1 (CSS only)

## Objective

Add visual feedback when navigating to a line in the diff viewer. The target line briefly highlights (flash animation) to help users locate it.

## Files to Modify

### 1. Webview Styles (in `SidecarPanelAdapter.getHtmlForWebview()`)

#### Add highlight animation CSS

```css
/* Line highlight animation for navigation */
@keyframes highlight-flash {
  0% {
    background-color: var(--vscode-editor-findMatchHighlightBackground);
  }
  50% {
    background-color: var(--vscode-editor-findMatchHighlightBackground);
  }
  100% {
    background-color: transparent;
  }
}

.diff-line.highlight-target {
  animation: highlight-flash 2s ease-out;
}

.diff-line.highlight-target td {
  position: relative;
}

/* Overlay effect for stronger visibility */
.diff-line.highlight-target::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background-color: var(--vscode-editor-findMatchHighlightBackground);
  opacity: 0;
  animation: highlight-overlay 2s ease-out;
  pointer-events: none;
}

@keyframes highlight-overlay {
  0% {
    opacity: 0.5;
  }
  50% {
    opacity: 0.3;
  }
  100% {
    opacity: 0;
  }
}

/* Ensure diff-line is positioned for overlay */
.diff-line {
  position: relative;
}
```

## Implementation Notes

1. **Animation duration**: 2 seconds total
   - First second: Strong highlight
   - Second second: Fade out

2. **Color choice**: Uses VSCode's find match highlight color for consistency

3. **No spec animation requirement**: The spec noted "No animation needed" for the question about animation duration, but a brief flash improves UX. Keep it subtle.

4. **Alternative: Simpler approach**

If the overlay approach causes issues with table rows, use a simpler background transition:

```css
.diff-line.highlight-target {
  background-color: var(--vscode-editor-findMatchHighlightBackground) !important;
  transition: background-color 2s ease-out;
}

.diff-line.highlight-target td {
  background-color: inherit !important;
}
```

Then remove the class after 2s:
```typescript
setTimeout(() => {
  lineRow.classList.remove('highlight-target');
}, 2000);
```

## JavaScript (from Task 5)

Already implemented in `scrollToLineInDiff()`:

```typescript
// Add highlight class
lineRow.classList.add('highlight-target');

// Remove highlight after animation
setTimeout(() => {
  lineRow.classList.remove('highlight-target');
}, 2000);
```

## Validation

- [ ] Target line flashes when navigated to
- [ ] Animation is visible but not distracting
- [ ] Works with all line types (addition, deletion, context)
- [ ] Animation completes and line returns to normal state
- [ ] Multiple navigations work (class removed before re-adding)

## Test Scenarios

1. Navigate to addition line → green line flashes
2. Navigate to deletion line → red line flashes
3. Navigate to context line → neutral line flashes
4. Rapidly navigate to different lines → each highlights correctly
