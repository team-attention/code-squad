# Task 6: Close Panel on AI Terminal Close

## Goal

When the AI terminal closes, close the Sidecar panel. The panel lifecycle is bound to the AI terminal.

## Files to Modify

1. `src/adapters/inbound/controllers/AIDetectionController.ts`

## Implementation

### AIDetectionController.ts

Update `handleTerminalClose()` to close the panel:

```typescript
import { SidecarPanelAdapter } from '../../outbound/presenters/SidecarPanelAdapter';

// ... existing code

private handleTerminalClose(terminal: vscode.Terminal): void {
    const terminalId = this.getTerminalId(terminal);
    const session = this.activeAISessions.get(terminalId);

    if (session) {
        console.log(`AI terminal closed: ${session.type}`);
        this.activeAISessions.delete(terminalId);
        this.terminalGateway.unregisterTerminal(terminalId);

        // Close panel when last AI session ends
        if (this.activeAISessions.size === 0) {
            // Clear snapshots
            this.snapshotRepository.clear();

            // Reset panel state (clears baseline)
            if (this.panelStateManager) {
                this.panelStateManager.reset();
            }

            // Close the panel
            if (SidecarPanelAdapter.currentPanel) {
                SidecarPanelAdapter.currentPanel.dispose();
            }

            console.log('AI session ended, panel closed');
        }
    }
}
```

## Behavior Change

**Before**: Panel stayed open with message "No active AI sessions. Sidecar panel will remain open."

**After**: Panel closes automatically when AI terminal closes.

## Why This Change

From spec:
> **Auto-close Panel**: Close Sidecar panel when AI terminal closes (lifecycle bound to AI terminal)

The panel's purpose is to track changes during an AI session. When the session ends, the panel should close to signal that tracking has stopped.

## Validation

- [ ] Panel closes when AI terminal closes
- [ ] State is reset (baseline cleared)
- [ ] Snapshots are cleared
- [ ] No error if panel was already closed
