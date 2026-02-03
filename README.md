<div align="center">

<img alt="csq" src="assets/code-squad-full.png" width="400">

**Tmux-powered worktree dashboard for multi-branch development.**

https://github.com/user-attachments/assets/cd1c6eb1-21fe-4179-91b8-a1abd920ea41

[![npm](https://img.shields.io/npm/v/code-squad-cli)](https://npmjs.com/package/code-squad-cli)
[![GitHub Stars](https://img.shields.io/github/stars/team-attention/code-squad?style=flat&color=yellow)](https://github.com/team-attention/code-squad)
[![License](https://img.shields.io/github/license/team-attention/code-squad)](LICENSE)

</div>

## Install

```bash
npm install -g code-squad-cli
```

## Quick Start

```bash
csq              # Open tmux dashboard
```

**Dashboard controls:**
- `j/k` or `↑/↓` - Navigate worktree list
- `n` - Create new worktree
- `d` - Delete worktree
- `Enter` - Open worktree in new pane
- `q` - Quit (closes all panes)
- `Ctrl+b m` - Move/swap panes

## CLI Commands

```bash
csq              # Open tmux dashboard (default)
csq new <name>   # Create worktree
csq list         # List worktrees
csq quit         # Delete current worktree
csq --legacy     # Use old TUI mode
```

## Features

- **Tmux Dashboard** - Manage worktrees with keyboard shortcuts
- **Multi-pane Layout** - Work on multiple branches side-by-side
- **Auto tmux Install** - Installs tmux if missing (macOS/Linux)
- **File Sync** - Copy config files (`.env*`) to new worktrees

## Requirements

- Git
- tmux (auto-installed on first run)

## Config

Create `~/.code-squad/config.json`:

```json
{
  "projects": {
    "/path/to/project": {
      "worktreeCopyPatterns": [".env*", "config/**"]
    }
  }
}
```

Or create `.code-squad.json` in your project root.

---

## VSCode Extension

For IDE users who prefer visual management.

### Install

Search "Code Squad" in Extensions or [Open VSX](https://open-vsx.org/extension/JakePark/code-squad)

### Features

- **Thread Management** - Multiple AI agents in isolated workspaces
- **Worktree Isolation** - Each thread gets its own git worktree
- **Diff View** - File-by-file or grouped by function/class
- **Inline Comments** - Select lines, comment, send to AI
- **Auto-Detect** - Detects claude, codex, gemini, opencode

### Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `codeSquad.autoDetect` | `true` | Auto-detect AI tools |
| `codeSquad.autoShowPanel` | `true` | Open panel when AI detected |
| `codeSquad.worktreeCopyPatterns` | `[]` | Files to copy to worktree |

---

## Links

[GitHub](https://github.com/team-attention/code-squad) · [Issues](https://github.com/team-attention/code-squad/issues) · [npm](https://npmjs.com/package/code-squad-cli)

---

<div align="center">

**MIT License**

</div>
