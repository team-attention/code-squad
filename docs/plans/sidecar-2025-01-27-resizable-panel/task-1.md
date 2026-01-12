# Task 1: Add resizer with drag functionality

## File

`src/adapters/presenters/SidecarPanelAdapter.ts`

## Changes

### 1. HTML - Add resizer element

Insert between `.main-content` and `.sidebar`:

```html
<div class="resizer" id="panel-resizer"></div>
```

Reorder elements: main-content → resizer → sidebar

### 2. CSS - Grid layout update

```css
body {
  grid-template-columns: 1fr 4px 320px;
  grid-template-areas: "main resizer sidebar";
}
```

### 3. CSS - Resizer styling

```css
.resizer {
  grid-area: resizer;
  background: var(--vscode-panel-border);
  cursor: col-resize;
  transition: background 0.2s;
}

.resizer:hover,
.resizer.dragging {
  background: var(--vscode-focusBorder, #007acc);
}

body.resizing {
  cursor: col-resize;
  user-select: none;
}
```

### 4. CSS - Collapsed state (complete hide)

```css
body.sidebar-collapsed {
  grid-template-columns: 1fr 0 0;
}

body.sidebar-collapsed .resizer {
  display: none;
}

body.sidebar-collapsed .sidebar {
  display: none;
}
```

### 5. JavaScript - Drag logic

```javascript
const resizer = document.getElementById('panel-resizer');
let isResizing = false;
let sidebarWidth = 320;

resizer.addEventListener('mousedown', (e) => {
  if (bodyEl.classList.contains('sidebar-collapsed')) return;
  isResizing = true;
  bodyEl.classList.add('resizing');
  resizer.classList.add('dragging');
});

document.addEventListener('mousemove', (e) => {
  if (!isResizing) return;
  const newWidth = window.innerWidth - e.clientX;
  const clampedWidth = Math.max(150, Math.min(600, newWidth));
  sidebarWidth = clampedWidth;
  bodyEl.style.gridTemplateColumns = `1fr 4px ${clampedWidth}px`;
});

document.addEventListener('mouseup', () => {
  if (!isResizing) return;
  isResizing = false;
  bodyEl.classList.remove('resizing');
  resizer.classList.remove('dragging');
});
```

### 6. Update expand/collapse functions

Update `expandSidebar()` to restore saved width:

```javascript
function expandSidebar() {
  bodyEl.classList.remove('sidebar-collapsed');
  sidebarEl.classList.remove('collapsed');
  bodyEl.style.gridTemplateColumns = `1fr 4px ${sidebarWidth}px`;
  // ... rest
}
```

## Acceptance Criteria

- [ ] Drag resizer to adjust sidebar width
- [ ] Min 150px, max 600px limits
- [ ] Hover/drag visual feedback
- [ ] Collapsed state hides resizer and sidebar completely
- [ ] Toggle button still works
