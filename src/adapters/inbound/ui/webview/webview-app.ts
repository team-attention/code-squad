/**
 * Webview Application
 *
 * Main application logic for the webview UI. This file is bundled by esbuild
 * along with webview-entry.ts and exposes the UI components to the window object.
 */

import { initialize, stateManager } from './core';

// ===== Type Declarations =====

declare global {
  interface Window {
    SidecarApp: {
      initialize: () => void;
      stateManager: typeof stateManager;
    };
  }
}

// ===== Expose on Window =====

window.SidecarApp = {
  initialize,
  stateManager,
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  // DOM already loaded, initialize now
  initialize();
}
