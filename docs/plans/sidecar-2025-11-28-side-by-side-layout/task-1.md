# Task 1: Remove moveEditorToRightGroup Command

## Objective

Remove the VSCode command that moves the terminal editor to the right group, allowing the terminal to stay in the left group (ViewColumn.One) while Sidecar opens in the right group (ViewColumn.Two).

## File Changes

### `src/adapters/inbound/controllers/AIDetectionController.ts`

**Location**: `moveTerminalToSide()` method, lines 143-148

**Before**:
```typescript
private async moveTerminalToSide(): Promise<void> {
    if (SidecarPanelAdapter.currentPanel) {
        return;
    }

    try {
        await vscode.commands.executeCommand('workbench.action.terminal.moveIntoEditor');
        await vscode.commands.executeCommand('workbench.action.moveEditorToRightGroup');
    } catch {
        console.log('Terminal move command not available, continuing with default layout');
    }
}
```

**After**:
```typescript
private async moveTerminalToSide(): Promise<void> {
    if (SidecarPanelAdapter.currentPanel) {
        return;
    }

    try {
        await vscode.commands.executeCommand('workbench.action.terminal.moveIntoEditor');
    } catch {
        console.log('Terminal move command not available, continuing with default layout');
    }
}
```

## Verification

```bash
npm run compile
npm run lint
```

## Manual Test Plan

1. **VSCode**: Run `claude` in terminal, verify terminal on left, Sidecar on right
2. **Cursor**: Run `claude` in terminal, verify no errors (graceful fallback)
3. **Existing Panel**: Open Sidecar first, then run `claude`, verify skip logic works
