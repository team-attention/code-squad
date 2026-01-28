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

## Two Ways to Use

| | **VSCode Extension** | **CLI** |
|---|---|---|
| **What** | Multi-agent session manager | Worktree manager |
| **Install** | Search "Code Squad" in Extensions | `npm install -g code-squad-cli` |
| **Use** | Manage threads, review diffs, inline feedback | `csq` — create/switch/delete worktrees |

---

## VSCode Extension

Manage AI agents in parallel. Isolated worktrees. Inline feedback. All in one sidebar.

### Install

1. Open Extensions (`Cmd+Shift+X`)
2. Search "Code Squad"
3. Click Install

Or download from [Open VSX](https://open-vsx.org/extension/JakePark/code-squad)

### Quick Start

1. **Start a Thread** — Click `+` in sidebar. Pick `Local` or `Worktree` isolation.
2. **Run AI** — `claude`, `codex`, `gemini`, or `opencode`
3. **Review** — See all changes in the panel
4. **Feedback** — Select lines, comment, submit directly to AI

### Features

| Feature | Description |
|---------|-------------|
| **Thread Management** | Multiple AI agents in isolated workspaces |
| **Worktree Isolation** | Each thread gets its own git worktree |
| **Diff View** | File-by-file or grouped by function/class |
| **Inline Comments** | Select → Comment → Send to AI |
| **Auto-Detect** | Detects `claude`, `codex`, `gemini`, `opencode` |

### Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `codeSquad.autoDetect` | `true` | Auto-detect AI tools |
| `codeSquad.autoShowPanel` | `true` | Open panel when AI detected |
| `codeSquad.worktreeCopyPatterns` | `[]` | Files to copy to worktree (e.g., `.env*`) |

---

## CLI

Manage worktrees from terminal. Create, switch, delete—without leaving your shell.

### Install

```bash
npm install -g code-squad-cli
```

### Usage

```bash
csq           # Interactive mode - select/create/delete worktrees
csq new       # Create new worktree
csq list      # List all worktrees
csq quit      # Exit current worktree
csq -p        # Persistent mode - stay in menu after action
```

### Flip (File Viewer)

```bash
csq flip              # Open browser UI for current directory
csq flip /path/to/dir # Open for specific directory
csq flip setup        # Setup iTerm2 hotkey (optional)
```

### Config

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

---

## Supported AI Tools

| Tool | Command |
|------|---------|
| [Claude Code](https://github.com/anthropics/claude-code) | `claude` |
| [Codex CLI](https://github.com/openai/codex) | `codex` |
| [Gemini CLI](https://github.com/google-gemini/gemini-cli) | `gemini` |
| [OpenCode](https://github.com/sst/opencode) | `opencode` |

---

## Links

[GitHub](https://github.com/team-attention/code-squad) · [Issues](https://github.com/team-attention/code-squad/issues) · [Changelog](https://github.com/team-attention/code-squad/releases)

---

<div align="center">

**MIT License**

</div>
