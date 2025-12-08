/**
 * AI Status Component
 *
 * Displays the current AI assistant status (Claude, Codex, Gemini, or Ready).
 */

export interface AIStatusData {
  active: boolean;
  type?: 'claude' | 'codex' | 'gemini' | string;
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
            : aiStatus.type;
    typeEl.textContent = label;
    badge.classList.add('active');
  } else {
    typeEl.textContent = 'Ready';
    badge.classList.remove('active');
  }
}
