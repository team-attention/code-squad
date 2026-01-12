# Task 7: Gutter Markers

**Phase**: 3 - Inline Comments in Diff Viewer
**Dependencies**: Task 5
**Files**: 2

## Objective

Add visual markers in the diff viewer gutter to indicate lines with comments. Clicking markers toggles inline comment visibility (fold/unfold).

## Files to Modify

### 1. Webview Script - Diff Rendering

Update `renderChunksToHtml()` to include gutter marker column:

```typescript
function renderChunksToHtml(chunks, chunkStates, comments = []) {
  // Build comment lookup by file+line
  const commentsByLine = new Map();
  comments.forEach(comment => {
    const key = comment.line;
    if (!commentsByLine.has(key)) {
      commentsByLine.set(key, []);
    }
    commentsByLine.get(key).push(comment);
  });

  let html = '<table class="diff-table">';

  chunks.forEach((chunk, chunkIndex) => {
    // Chunk header row
    html += `
      <tr class="chunk-header-row" data-chunk-index="${chunkIndex}">
        <td colspan="3" class="chunk-header">
          <!-- existing header content -->
        </td>
      </tr>
    `;

    // Chunk lines
    const isCollapsed = chunkStates[chunkIndex]?.isCollapsed;
    html += `<tbody class="chunk-lines ${isCollapsed ? 'collapsed' : ''}" data-chunk-index="${chunkIndex}">`;

    chunk.lines.forEach(line => {
      const lineNum = line.newLineNumber || line.oldLineNumber;
      const hasComments = commentsByLine.has(lineNum);
      const lineComments = commentsByLine.get(lineNum) || [];
      const hasPending = lineComments.some(c => !c.isSubmitted);
      const markerClass = hasComments
        ? (hasPending ? 'has-comment pending' : 'has-comment submitted')
        : '';

      html += `
        <tr class="diff-line ${line.type}" data-line="${lineNum}">
          <td class="diff-gutter ${markerClass}" onclick="toggleInlineComment(${lineNum})">
            ${hasComments ? '<span class="comment-marker">●</span>' : ''}
          </td>
          <td class="diff-line-num">${lineNum || ''}</td>
          <td class="diff-line-content" data-prefix="${getPrefix(line.type)}">${escapeHtml(line.content)}</td>
        </tr>
      `;

      // Inline comment row (collapsed by default, expanded in Task 8)
      if (hasComments) {
        html += `
          <tr class="inline-comment-row collapsed" data-line="${lineNum}">
            <td colspan="3">
              <div class="inline-comments">
                <!-- Comment boxes rendered here in Task 8 -->
              </div>
            </td>
          </tr>
        `;
      }
    });

    html += '</tbody>';
  });

  html += '</table>';
  return html;
}
```

### 2. Webview Script - Toggle Handler

```typescript
// Track folded state
const foldedComments = new Set(); // line numbers that are folded

function toggleInlineComment(lineNum) {
  const commentRow = document.querySelector(`.inline-comment-row[data-line="${lineNum}"]`);
  if (!commentRow) return;

  if (commentRow.classList.contains('collapsed')) {
    commentRow.classList.remove('collapsed');
    foldedComments.delete(lineNum);
  } else {
    commentRow.classList.add('collapsed');
    foldedComments.add(lineNum);
  }

  // Update marker icon
  updateMarkerIcon(lineNum);
}

function updateMarkerIcon(lineNum) {
  const gutter = document.querySelector(`.diff-line[data-line="${lineNum}"] .diff-gutter`);
  if (!gutter) return;

  const marker = gutter.querySelector('.comment-marker');
  if (marker) {
    const isFolded = foldedComments.has(lineNum);
    marker.textContent = isFolded ? '○' : '●'; // Hollow when folded, filled when expanded
  }
}
```

### 3. Webview Styles

```css
/* Gutter column */
.diff-gutter {
  width: 20px;
  min-width: 20px;
  text-align: center;
  cursor: default;
  user-select: none;
  border-right: 1px solid var(--vscode-panel-border);
}

.diff-gutter.has-comment {
  cursor: pointer;
}

.diff-gutter.has-comment:hover {
  background: var(--vscode-list-hoverBackground);
}

/* Comment marker */
.comment-marker {
  font-size: 10px;
  line-height: 1;
}

.diff-gutter.pending .comment-marker {
  color: var(--vscode-textLink-foreground); /* Blue for pending */
}

.diff-gutter.submitted .comment-marker {
  color: var(--vscode-descriptionForeground); /* Gray for submitted */
}

/* Inline comment row */
.inline-comment-row {
  background: var(--vscode-editor-background);
}

.inline-comment-row.collapsed {
  display: none;
}

.inline-comments {
  padding: 8px 8px 8px 28px; /* Align with content column */
  border-left: 3px solid var(--vscode-textLink-foreground);
  margin: 4px 0;
}
```

## Data Flow

```
Diff render
    │
    ├── For each line, check if comments exist for that line
    ├── Add gutter cell with marker if has comments
    └── Add collapsed inline-comment-row after line

User clicks marker
    │
    ▼
toggleInlineComment(lineNum)
    │
    ├── Toggle collapsed class on inline-comment-row
    └── Update marker icon (●/○)
```

## Considerations

1. **Line matching**: Comments use `line` property (1-indexed, matches `newLineNumber`)
2. **Multi-line comments**: Show marker on start line only
3. **Multiple comments per line**: Show single marker, expand shows all
4. **File context**: Filter comments to current file before building lookup

## Validation

- [ ] Gutter column appears in diff table
- [ ] Markers show on lines with comments
- [ ] Pending markers are blue
- [ ] Submitted markers are gray
- [ ] Clicking marker toggles inline row visibility
- [ ] Marker icon changes between ● and ○
- [ ] No markers on lines without comments

## Test Scenarios

1. View file with pending comment → blue marker on line
2. View file with submitted comment → gray marker on line
3. Click marker → inline row expands
4. Click marker again → inline row collapses
5. View file with no comments → no markers
6. View file with multiple comments on same line → single marker
