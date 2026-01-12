# Spec: Side-by-Side Layout for AI Terminal + Sidecar

**Slug**: `sidecar-2025-11-28-side-by-side-layout`
**Status**: Draft
**Created**: 2025-11-28

## Problem Statement

When AI is detected and Sidecar activates, both the AI terminal and Sidecar panel open as tabs in the same right editor group. Users cannot see terminal output and diff view simultaneously, defeating the purpose of the review workflow.

**Current behavior**:
```
┌─────────────────┬─────────────────────────────┐
│                 │  [Terminal] [Sidecar]  ←tabs│
│     (empty)     │                             │
│                 │      (one visible)          │
└─────────────────┴─────────────────────────────┘
```

**Desired behavior**:
```
┌─────────────────┬─────────────────────────────┐
│   AI Terminal   │         Sidecar             │
│                 │                             │
│   (left)        │         (right)             │
└─────────────────┴─────────────────────────────┘
```

## Root Cause

In `AIDetectionController.ts:144-145`:

```typescript
await vscode.commands.executeCommand('workbench.action.terminal.moveIntoEditor');
await vscode.commands.executeCommand('workbench.action.moveEditorToRightGroup');  // ← Causes issue
```

1. `moveIntoEditor` moves terminal to ViewColumn.One (left, default)
2. `moveEditorToRightGroup` pushes terminal to right
3. Sidecar opens with ViewColumn.Two (also right)
4. Both in same group = tabs

## Requirements

### Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-1 | AI terminal appears in left editor group (ViewColumn.One) |
| FR-2 | Sidecar panel appears in right editor group (ViewColumn.Two) |
| FR-3 | Both visible simultaneously without tab switching |
| FR-4 | Works on VSCode |
| FR-5 | Graceful fallback on Cursor (terminal may stay in bottom panel) |

### Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-1 | Minimal code change (low risk) |
| NFR-2 | No new dependencies |
| NFR-3 | Existing try-catch handles failures gracefully |

## Solution

Remove `workbench.action.moveEditorToRightGroup` command from `moveTerminalToSide()`.

### Before

```typescript
private async moveTerminalToSide(): Promise<void> {
    if (SidecarPanelAdapter.currentPanel) return;
    try {
        await vscode.commands.executeCommand('workbench.action.terminal.moveIntoEditor');
        await vscode.commands.executeCommand('workbench.action.moveEditorToRightGroup');
    } catch {
        console.log('Terminal move command not available, continuing with default layout');
    }
}
```

### After

```typescript
private async moveTerminalToSide(): Promise<void> {
    if (SidecarPanelAdapter.currentPanel) return;
    try {
        await vscode.commands.executeCommand('workbench.action.terminal.moveIntoEditor');
    } catch {
        console.log('Terminal move command not available, continuing with default layout');
    }
}
```

## Affected Files

| File | Change |
|------|--------|
| `src/adapters/inbound/controllers/AIDetectionController.ts` | Remove 1 line (line 145) |

## Architecture Compliance

| Layer | Impact | Compliant |
|-------|--------|-----------|
| Domain | None | N/A |
| Application | None | N/A |
| Adapters | 1 line removal | Yes |
| Infrastructure | None | N/A |

No architectural rules violated. Change is confined to an inbound adapter.

## Test Plan

### Manual Testing

1. **VSCode Test**
   - Run `claude` command in terminal
   - Verify: Terminal moves to left editor area
   - Verify: Sidecar opens on right
   - Verify: Both visible side-by-side

2. **Cursor Test**
   - Run `claude` command in terminal
   - Verify: Either side-by-side layout OR terminal stays in bottom panel with Sidecar in editor
   - Verify: No errors thrown

3. **Existing Panel Test**
   - Open Sidecar panel manually first
   - Run `claude` command
   - Verify: Terminal position unchanged (skip logic works)

## Success Criteria

- [ ] Side-by-side layout achieved on VSCode
- [ ] No regression on Cursor (graceful fallback)
- [ ] No console errors
- [ ] Compile succeeds
- [ ] Lint passes

## Alternatives Considered

| Approach | Description | Why not chosen |
|----------|-------------|----------------|
| ViewColumn.Beside | Change Sidecar to use `ViewColumn.Beside` | Less predictable position |
| Explicit layout orchestration | Use `evenEditorWidths` command | More commands = more failure points |
| Platform detection | Branch logic for VSCode vs Cursor | Maintenance burden |

## References

- Brainstorm: `docs/brainstorms/sidecar-2025-11-28-side-by-side-layout.md`
- VSCode API: `workbench.action.terminal.moveIntoEditor` (v1.58+)
