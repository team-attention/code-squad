/**
 * Sidebar Component
 *
 * Toggle and resize functionality for the sidebar panel.
 */

export interface SidebarState {
  isCollapsed: boolean;
  width: number;
}

export interface SidebarElements {
  body: HTMLElement;
  sidebar: HTMLElement;
  toggleButton: HTMLElement;
  resizer: HTMLElement;
}

/**
 * Expand sidebar to specified width
 */
export function expandSidebar(elements: SidebarElements, width: number): void {
  const { body, sidebar, toggleButton } = elements;
  body.classList.remove('sidebar-collapsed');
  sidebar.classList.remove('collapsed');
  body.style.gridTemplateColumns = `1fr 4px ${width}px`;
  toggleButton.textContent = '>';
  toggleButton.setAttribute('aria-label', 'Collapse file list panel');
}

/**
 * Collapse sidebar
 */
export function collapseSidebar(elements: SidebarElements): void {
  const { body, sidebar, toggleButton } = elements;
  body.classList.add('sidebar-collapsed');
  sidebar.classList.add('collapsed');
  body.style.gridTemplateColumns = '';
  toggleButton.textContent = '<';
  toggleButton.setAttribute('aria-label', 'Expand file list panel');
}

/**
 * Setup sidebar toggle button handler
 */
export function setupSidebarToggle(
  elements: SidebarElements,
  getState: () => SidebarState,
  signal: AbortSignal
): void {
  elements.toggleButton.addEventListener(
    'click',
    () => {
      const state = getState();
      if (elements.body.classList.contains('sidebar-collapsed')) {
        expandSidebar(elements, state.width);
      } else {
        collapseSidebar(elements);
      }
    },
    { signal }
  );
}

/**
 * Setup panel resizer drag handlers
 */
export function setupResizer(
  elements: SidebarElements,
  onWidthChange: (width: number) => void,
  signal: AbortSignal
): void {
  const { body, resizer } = elements;
  let isResizing = false;

  resizer.addEventListener(
    'mousedown',
    () => {
      if (body.classList.contains('sidebar-collapsed')) return;
      isResizing = true;
      body.classList.add('resizing');
      resizer.classList.add('dragging');
      body.style.transition = 'none';
    },
    { signal }
  );

  document.addEventListener(
    'mousemove',
    (e) => {
      if (!isResizing) return;
      const clampedWidth = Math.max(150, Math.min(600, window.innerWidth - e.clientX));
      onWidthChange(clampedWidth);
      body.style.gridTemplateColumns = `1fr 4px ${clampedWidth}px`;
    },
    { signal }
  );

  document.addEventListener(
    'mouseup',
    () => {
      if (!isResizing) return;
      isResizing = false;
      body.classList.remove('resizing');
      resizer.classList.remove('dragging');
      body.style.transition = '';
    },
    { signal }
  );
}

/**
 * Get sidebar DOM elements
 * Returns null if any element is missing
 */
export function getSidebarElements(): SidebarElements | null {
  const body = document.body;
  const sidebar = document.querySelector('.sidebar') as HTMLElement | null;
  const toggleButton = document.getElementById('toggle-sidebar');
  const resizer = document.getElementById('panel-resizer');

  if (!sidebar || !toggleButton || !resizer) return null;

  return { body, sidebar, toggleButton, resizer };
}
