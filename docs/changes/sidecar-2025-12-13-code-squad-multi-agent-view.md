# Code Squad Multi-Agent View

**Spec**: `docs/specs/sidecar-2025-12-13-code-squad-multi-agent-view.md`
**Plan**: `docs/plans/sidecar-2025-12-13-code-squad-multi-agent-view/main.md`
**Status**: Implemented

## Summary

Implemented multi-agent view support for Sidecar, enabling users to manage multiple AI agent threads with a dedicated sidebar, aggregated file views, and keyboard shortcuts for quick navigation.

## Changes

### Domain Layer
- **AISession.ts**: Added `AgentMetadata` interface and `AgentStatus` type for tracking agent name, role, status, and file count. Extended `AISession` class with `agentMetadata` getter/setter and convenience properties (`agentName`, `agentStatus`).

### Application Layer
- **SessionContext.ts**: Added optional `agentMetadata` field to support per-session agent metadata.
- **PanelState.ts**: Added `AgentDisplayInfo` interface, extended `PanelState` with `agentInfo` and `isAggregatedView` fields, and added `agentName`/`agentColorIndex` to `FileInfo` for aggregated view.
- **IPanelStateManager.ts**: Added `setAgentInfo()` and `setAggregatedView()` methods.
- **PanelStateManager.ts**: Implemented agent metadata methods with render callbacks.

### Adapters Layer
- **ThreadTreeDataProvider.ts** (new): VSCode TreeDataProvider for thread list with status icons and selection.
- **ThreadListController.ts** (new): Controller managing thread selection, aggregated view, and cycling.
- **AIDetectionController.ts**: Added session change callback mechanism (`setOnSessionChange`, `notifySessionChange`).
- **SidecarPanelAdapter.ts**: Panel header now shows agent name and status.

### UI/Webview
- **AIStatus.ts**: Added `renderAgentHeader()` function with status icons and XSS protection.
- **FileList.ts**: Added agent badge rendering for aggregated file list.
- **html.ts**: Added `id="header-title"` for dynamic header updates.
- **styles.ts**: Added CSS for agent header, status colors, and 6-color agent badge palette.
- **App.ts**: Integrated `renderAgentHeader()` call in state rendering.

### Extension Configuration
- **package.json**: Added activity bar view container, thread list view, commands (`selectThread`, `cycleThreads`), and keybinding (`Cmd+Shift+A`/`Ctrl+Shift+A`).
- **extension.ts**: Wired ThreadListController with session change callbacks and registered commands.

## Files Changed

| File | Type |
|------|------|
| `src/domain/entities/AISession.ts` | Modified |
| `src/application/ports/outbound/SessionContext.ts` | Modified |
| `src/application/ports/outbound/PanelState.ts` | Modified |
| `src/application/services/IPanelStateManager.ts` | Modified |
| `src/application/services/PanelStateManager.ts` | Modified |
| `src/adapters/inbound/ui/ThreadTreeDataProvider.ts` | Added |
| `src/adapters/inbound/controllers/ThreadListController.ts` | Added |
| `src/adapters/inbound/controllers/AIDetectionController.ts` | Modified |
| `src/adapters/inbound/ui/webview/components/sidebar/AIStatus.ts` | Modified |
| `src/adapters/inbound/ui/webview/components/sidebar/FileList.ts` | Modified |
| `src/adapters/inbound/ui/webview/html.ts` | Modified |
| `src/adapters/inbound/ui/webview/styles.ts` | Modified |
| `src/adapters/inbound/ui/webview/core/App.ts` | Modified |
| `package.json` | Modified |
| `src/extension.ts` | Modified |

## Verification

```bash
npm run compile  # Passed
npm run lint     # Passed (11 warnings - pre-existing, no errors)
```

## Test Notes

Manual testing required:
1. Start multiple Claude Code sessions in different terminals
2. Verify threads appear in Sidecar activity bar
3. Test "All Agents" aggregated view shows combined files
4. Test `Cmd+Shift+A` cycles through threads
5. Verify agent status icons update correctly
