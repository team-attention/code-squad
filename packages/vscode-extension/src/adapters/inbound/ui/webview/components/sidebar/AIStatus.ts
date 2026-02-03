/**
 * AI Status Component
 *
 * Displays the current AI assistant status (Claude, Codex, Gemini, or Ready).
 * Also handles agent header display for multi-agent mode.
 */

export interface AIStatusData {
  active: boolean;
  type?: 'claude' | 'codex' | 'gemini' | 'opencode' | string;
}

export type AgentStatus = 'working' | 'idle' | 'waiting' | 'error';

export interface AgentDisplayInfo {
  name: string;
  status: AgentStatus;
}

/**
 * Render AI status badge
 * Updates the DOM directly
 */
export function renderAIStatus(aiStatus: AIStatusData): void {
  const badge = document.getElementById('status-badge');
  const typeEl = document.getElementById('ai-type');

  if (!badge || !typeEl) return;

  if (aiStatus.active && aiStatus.type) {
    const label =
      aiStatus.type === 'claude'
        ? 'Claude'
        : aiStatus.type === 'codex'
          ? 'Codex'
          : aiStatus.type === 'gemini'
            ? 'Gemini'
            : aiStatus.type === 'opencode'
              ? 'OpenCode'
              : aiStatus.type;
    typeEl.textContent = label;
    badge.classList.add('active');
  } else {
    typeEl.textContent = 'Ready';
    badge.classList.remove('active');
  }
}

/**
 * Get status icon for agent status
 */
function getStatusIcon(status: AgentStatus): string {
  switch (status) {
    case 'working':
      return '●';
    case 'waiting':
      return '●';
    case 'error':
      return '●';
    case 'idle':
    default:
      return '○';
  }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Render agent header for multi-agent mode
 * Updates the header title element
 */
export function renderAgentHeader(
  agentInfo: AgentDisplayInfo | undefined,
  isAggregatedView: boolean | undefined
): void {
  const headerTitle = document.getElementById('header-title');
  if (!headerTitle) return;

  if (isAggregatedView) {
    headerTitle.innerHTML = `
      <div class="agent-header agent-header--aggregated">
        <span class="agent-icon">◫</span>
        <span class="agent-name">All Agents</span>
      </div>
    `;
  } else if (agentInfo) {
    const statusClass = `agent-status--${agentInfo.status}`;
    const statusIcon = getStatusIcon(agentInfo.status);
    headerTitle.innerHTML = `
      <div class="agent-header">
        <span class="agent-status ${statusClass}">${statusIcon}</span>
        <span class="agent-name">${escapeHtml(agentInfo.name)}</span>
      </div>
    `;
  } else {
    headerTitle.textContent = 'Code Squad';
  }
}
