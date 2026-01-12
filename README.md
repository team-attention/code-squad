<div align="center">

<img alt="Code Squad" src="assets/code-squad-full.png" width="400">

<br />

**Immersive multi-agent coding.**

https://github.com/user-attachments/assets/cd1c6eb1-21fe-4179-91b8-a1abd920ea41

[![Open VSX Downloads](https://img.shields.io/open-vsx/dt/JakePark/code-squad?label=Downloads&color=teal)](https://open-vsx.org/extension/JakePark/code-squad)
[![GitHub Stars](https://img.shields.io/github/stars/team-attention/code-squad?style=flat&color=yellow)](https://github.com/team-attention/code-squad)
[![License](https://img.shields.io/github/license/team-attention/code-squad)](LICENSE)

</div>

<br />

> **Note**: This project was originally called "Sidecar". See [legacy documentation](SIDECAR_README.md).

## Why Code Squad?

Running multiple AI agents in parallel is powerful — but switching between terminals, tracking changes across workspaces, and losing context is exhausting.

- Juggling multiple terminals breaks your focus
- Hard to see what changed across parallel sessions
- Context switching kills the flow

**Code Squad makes multi-agent coding immersive.**

Manage all your AI sessions in one place. See every change. Give feedback inline. Stay in the zone while your agents work in parallel.

---

## How It Works

### 1. Start a Thread

Open **Thread Management** in the sidebar and click `+`.

- Enter a **task name**
- Choose **isolation mode**:
  - `Local` - Work in current branch
  - `Worktree` - Create isolated worktree (recommended for parallel work)

### 2. Run Your AI Agent

A terminal opens. Run your preferred AI agent:

```bash
claude    # Claude Code
codex     # OpenAI Codex CLI
gemini    # Gemini CLI
opencode  # OpenCode
```

### 3. Review Changes

When AI modifies files, **Code Squad panel** shows all changes:

- File-by-file Diff view
- Scope view (grouped by function/class)

### 4. Give Inline Feedback

Select lines that need changes. Write a comment. Hit **Submit** — it goes directly to the AI terminal.

```
"Add error handling to this function"
    ↓
AI starts fixing immediately
```

---

## Features

| Feature | Description |
|---------|-------------|
| **Thread Management** | Run multiple AI agents in isolated workspaces |
| **Isolation Modes** | `Local` (current branch) or `Worktree` (isolated directory) |
| **Attach to Worktree** | Connect Code Squad to existing git worktrees |
| **Auto-Detect** | Automatically detects `claude`, `codex`, `gemini`, `opencode` |
| **Diff View** | GitHub-style change comparison |
| **Inline Comments** | Select lines → Comment → Send to AI |
| **Scope View** | Changes grouped by function/class |
| **Status Tracking** | Real-time AI status with color indicators |

### Thread Actions

Each thread in the sidebar has quick actions:

| Action | Description |
|--------|-------------|
| **Terminal** | Open/focus the thread's terminal |
| **Open in Editor** | Open worktree folder in new VS Code window |
| **Cleanup** | Delete thread and optionally remove worktree |

### Status Indicators

| Status | Color | Description |
|--------|-------|-------------|
| **Working** | 🟢 Green | AI is actively processing (pulsing) |
| **Waiting** | 🟡 Yellow | AI waiting for confirmation (y/n) |
| **Idle** | 🔵 Blue | AI ready for input |
| **Inactive** | ⚪ Gray | No AI session running |

---

## Installation

**VS Code / Cursor Extension**

1. Open Extensions (`Cmd+Shift+X`)
2. Search "Code Squad"
3. Click Install

Or download from [Open VSX](https://open-vsx.org/extension/JakePark/code-squad)

---

## Supported AI Tools

| Tool | Command |
|------|---------|
| [Claude Code](https://github.com/anthropics/claude-code) | `claude` |
| [Codex CLI](https://github.com/openai/codex) | `codex` |
| [Gemini CLI](https://github.com/google-gemini/gemini-cli) | `gemini` |
| [OpenCode](https://github.com/sst/opencode) | `opencode` |

---

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `codeSquad.autoDetect` | `true` | Auto-detect AI tools in terminal |
| `codeSquad.autoShowPanel` | `true` | Open panel when AI detected |
| `codeSquad.includeFiles` | `[]` | Glob patterns for gitignored files to track |
| `codeSquad.worktreeCopyPatterns` | `[]` | Files to copy when creating worktree (e.g., `.env*`, `config/**`) |

### CLI Global Configuration

Create `~/.code-squad/config.json` to configure per-project settings for CLI:

```json
{
  "projects": {
    "/path/to/project-a": {
      "worktreeCopyPatterns": [".env*", "config/**"]
    },
    "/path/to/project-b": {
      "worktreeCopyPatterns": [".env"]
    }
  }
}
```

---

## CLI

Code Squad includes a CLI tool `csq` with the `flip` command for visual prompt composition.

### Installation

```bash
npm install -g code-squad-cli
```

### Usage

```bash
csq flip              # Open browser UI in current directory
csq flip /path/to/dir # Open browser UI for specific directory
csq flip setup        # Setup iTerm2 hotkey
```

### iTerm2 Hotkey Setup (macOS)

Run `csq flip setup` and follow the instructions:

1. **iTerm2 → Settings → Keys → Key Bindings**
2. Click **+** to add new binding
3. **Keyboard Shortcut**: Choose your preferred shortcut (e.g., `⌘⇧F`)
4. **Action**: Select `Run Coprocess`
5. **Command**: Paste the path from clipboard (e.g., `~/.config/csq/flip-hotkey.sh`)

Now press the hotkey anywhere in iTerm2 to open the flip UI for your current directory.

**Note**: Works even while Claude Code or other AI tools are running in the terminal.

---

## Requirements

- VS Code 1.93.0+ or Cursor

---

## Links

[GitHub](https://github.com/team-attention/code-squad) · [Issues](https://github.com/team-attention/code-squad/issues) · [Changelog](https://github.com/team-attention/code-squad/releases)

---

<div align="center">

**MIT License**

</div>
