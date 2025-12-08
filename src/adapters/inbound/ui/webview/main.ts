/**
 * Webview Main Entry Point
 *
 * This will replace script.ts as the main orchestrator.
 * For now, it re-exports the existing script to maintain functionality.
 */

// Import existing script to keep functionality during migration
import { webviewScript } from './script';

// Re-export for now - will be replaced incrementally
export { webviewScript };
