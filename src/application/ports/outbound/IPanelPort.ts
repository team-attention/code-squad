import { PanelState } from './PanelState';

/**
 * Panel port - single render method
 *
 * The adapter receives the complete state and decides how to render it.
 * This is the "intent": render this state to the user.
 */
export interface IPanelPort {
    /**
     * Render the panel with the given state
     * Adapter decides how to present it (Webview, TreeView, etc.)
     */
    render(state: PanelState): void;

    /**
     * Show/reveal the panel
     */
    show(): void;
}
