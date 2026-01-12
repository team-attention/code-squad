# Spec: Claude Code Terminal Mode Auto-Configuration

## Problem Statement

Sidecar detects AI coding assistants by monitoring terminal shell executions via `onDidStartTerminalShellExecution` event. When users launch Claude Code through the native UI (Command Palette / status bar icon) instead of the terminal, Sidecar cannot detect the session and the review panel does not open automatically.

Claude Code extension provides a setting `claudeCode.useTerminal: true` that forces all sessions to use terminal mode.

## Proposed Solution

On Sidecar activation, if Claude Code is installed and `useTerminal` is not `true`, show a QuickPick that nudges user to enable it. Make the "Enable" option pre-selected so user naturally accepts.

## Use Cases

### UC1: Prompt Terminal Mode on Activation
- **Actor**: Developer with Claude Code extension installed
- **Trigger**: Sidecar extension activates
- **Preconditions**:
  - Claude Code extension is installed
  - `claudeCode.useTerminal` is not `true`
- **Flow**:
  1. Sidecar activates
  2. Check if Claude Code extension is installed
  3. Check if `claudeCode.useTerminal` is already `true` → skip if yes
  4. Show QuickPick with "Enable" pre-selected:
     ```
     Sidecar works best with Claude Code in terminal mode.

     ● Enable terminal mode (Recommended)
     ○ Skip
     ```
  5. If "Enable" selected → set `claudeCode.useTerminal: true` in global settings
  6. If "Skip" selected → do nothing, don't ask again this session
- **Postconditions**:
  - Setting is configured (or skipped)
- **Business Rules**:
  - Only prompt once per VS Code session
  - Pre-select "Enable" option (user just presses Enter to accept)
  - No state persistence needed - ask again next session if still not enabled
- **Location**: `src/adapters/inbound/controllers/ClaudeCodeConfigController.ts` (new)

## User Experience

### QuickPick Design

```
┌─────────────────────────────────────────────────────┐
│ Sidecar works best with Claude Code in terminal mode │
├─────────────────────────────────────────────────────┤
│ ● Enable terminal mode (Recommended)                │
│ ○ Skip                                              │
└─────────────────────────────────────────────────────┘
```

- **Pre-selected**: "Enable terminal mode (Recommended)"
- User just presses **Enter** → enabled
- User has to actively arrow-down to skip

### Flow

```
[Sidecar activates]
  |
  v
[Claude Code installed?] -- No --> [Done]
  |
  Yes
  v
[useTerminal already true?] -- Yes --> [Done]
  |
  No
  v
[Show QuickPick with Enable pre-selected]
  |
  +-- Enter (Enable) --> [Set useTerminal: true]
  |
  +-- Skip --> [Done, ask again next session]
```

## Technical Considerations

### Implementation

```typescript
// In ClaudeCodeConfigController.ts
async promptTerminalMode(): Promise<void> {
  const claudeExt = vscode.extensions.getExtension('anthropic.claude-code');
  if (!claudeExt) return;

  const config = vscode.workspace.getConfiguration('claudeCode');
  if (config.get('useTerminal') === true) return;

  const items = [
    { label: '$(check) Enable terminal mode', description: '(Recommended)', picked: true },
    { label: '$(x) Skip' },
  ];

  const pick = await vscode.window.showQuickPick(items, {
    title: 'Sidecar works best with Claude Code in terminal mode',
  });

  if (pick?.label.includes('Enable')) {
    await config.update('useTerminal', true, vscode.ConfigurationTarget.Global);
  }
}
```

### Architecture

- New file: `src/adapters/inbound/controllers/ClaudeCodeConfigController.ts`
- Call from `extension.ts` on activation
- No state tracking needed (stateless, ask each session if needed)

## Out of Scope

- Listening for setting changes (no auto-re-enable)
- Listening for Claude Code installation after Sidecar
- Restoring settings on uninstall
- Codex/Gemini (already terminal-based)
