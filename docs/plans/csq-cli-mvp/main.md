# Implementation Plan: csq CLI MVP

## Overview

Create a shell-based CLI tool (`csq`) for managing worktree-based AI coding sessions from the terminal. The CLI provides the core Thread Management functionality of the Code Squad VSCode extension without requiring VSCode.

## Architecture Decision

### Shell Script Approach

The spec specifies shell scripts (`.sh` files) for the CLI implementation. This is appropriate because:

1. **Minimal dependencies** - Only requires bash, fzf, gum (external tools for TUI)
2. **Fast execution** - No compilation or runtime startup overhead
3. **Easy installation** - `brew install` friendly, single file distribution possible
4. **Git integration** - Shell scripts naturally integrate with git commands

### Reuse Strategy

While the spec mentions `@code-squad/core` reuse, shell scripts cannot directly use TypeScript modules. The reuse approach:

1. **Logic Reuse**: Port the domain logic (session lifecycle, worktree management) to shell functions
2. **Data Format Compatibility**: Use the same JSON schema for `sessions.json` so VSCode extension can potentially share session data
3. **Future Bridge**: If needed, a Node.js wrapper could be added later to call TypeScript core

### Data Storage

```
.code-squad/
├── config.yml          # Repository configuration
├── sessions.json       # Active session list
└── locks/
    └── {session-id}.lock   # PID-based session locks
```

## Technical Design

### Session Lifecycle

```
                    ┌─────────────┐
                    │   csq new   │
                    └─────┬───────┘
                          │
                          ▼
              ┌───────────────────────┐
              │  Create Session Entry │
              │  - Generate UUID      │
              │  - Create lock file   │
              └───────────┬───────────┘
                          │
          ┌───────────────┴───────────────┐
          │                               │
          ▼                               ▼
┌─────────────────────┐       ┌─────────────────────┐
│   Local Mode        │       │   Worktree Mode     │
│   - Use current dir │       │   - git worktree    │
│   - No git changes  │       │   - Copy patterns   │
└─────────────────────┘       └─────────────────────┘
          │                               │
          └───────────────┬───────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │    Open Terminal      │
              │    (native/iterm/tmux)│
              └───────────────────────┘
```

### Session Status Detection

```shell
# Lock file check
if [ -f ".code-squad/locks/{id}.lock" ]; then
    pid=$(cat ".code-squad/locks/{id}.lock")
    if kill -0 "$pid" 2>/dev/null; then
        status="active"
    else
        status="terminated"
    fi
else
    status="terminated"
fi
```

### Configuration Schema

```yaml
# .code-squad/config.yml
worktree:
  basePath: "../{repo}.worktree"  # {repo} = current repo name
  copyPatterns:
    - "node_modules"
    - ".env*"
    - "dist"

terminal:
  opener: "native"        # native | iterm | tmux
  initCommand: ""         # command to run on session start
```

### Sessions Schema

```json
{
  "sessions": [
    {
      "id": "uuid-string",
      "name": "session-name",
      "mode": "local" | "worktree",
      "workingDir": "/absolute/path",
      "branch": "branch-name",
      "worktreePath": "/absolute/worktree/path",
      "createdAt": 1704412800000,
      "pid": 12345
    }
  ]
}
```

## Test Scenarios

Use Cases derive from spec. Pseudo-code level for verification before implementation.

### TS1: ListSessions - Happy Path

**Use Case**: UC1

```pseudo
// Arrange
sessions.json = {
  sessions: [
    { id: "abc", name: "feature-a", mode: "worktree", pid: 1234 }
  ]
}
locks/abc.lock = "1234"
process 1234 is running

// Act
result = csq list

// Assert
expect(result).toContain("feature-a")
expect(result).toContain("active")
```

### TS2: ListSessions - Terminated Session

**Use Case**: UC1

```pseudo
// Arrange
sessions.json = {
  sessions: [
    { id: "abc", name: "feature-a", mode: "worktree", pid: 1234 }
  ]
}
locks/abc.lock = "1234"
process 1234 is NOT running (dead)

// Act
result = csq list

// Assert
expect(result).toContain("feature-a")
expect(result).toContain("terminated")
```

### TS3: ListSessions - No Lock File

**Use Case**: UC1

```pseudo
// Arrange
sessions.json = {
  sessions: [
    { id: "abc", name: "feature-a", mode: "worktree", pid: 1234 }
  ]
}
locks/abc.lock does NOT exist

// Act
result = csq list

// Assert
expect(result).toContain("feature-a")
expect(result).toContain("terminated")
```

### TS4: CreateSession - Local Mode

**Use Case**: UC2

```pseudo
// Arrange
cwd = "/repo"
config.yml exists
sessions.json = { sessions: [] }

// Act
csq new "test-session" --mode local

// Assert
expect(sessions.json.sessions).toHaveLength(1)
expect(sessions.json.sessions[0].mode).toBe("local")
expect(sessions.json.sessions[0].workingDir).toBe("/repo")
expect(locks/{id}.lock).toExist()
expect(terminal).toBeOpenedAt("/repo")
```

### TS5: CreateSession - Worktree Mode

**Use Case**: UC2

```pseudo
// Arrange
cwd = "/repo"
config.yml = { worktree: { basePath: "../{repo}.worktree", copyPatterns: ["node_modules"] } }
sessions.json = { sessions: [] }

// Act
csq new "feature-x" --mode worktree

// Assert
expect(git_worktree_add).toHaveBeenCalledWith("../repo.worktree/feature-x", "feature-x")
expect(node_modules).toBeCopiedTo("../repo.worktree/feature-x/node_modules")
expect(sessions.json.sessions[0].worktreePath).toBe("/absolute/repo.worktree/feature-x")
expect(terminal).toBeOpenedAt(worktreePath)
```

### TS6: CreateSession - Init Command Execution

**Use Case**: UC2

```pseudo
// Arrange
config.yml = { terminal: { initCommand: "pnpm install" } }

// Act
csq new "test" --mode local

// Assert
expect(terminal).toExecute("pnpm install")
```

### TS7: AttachWorktree - Select and Attach

**Use Case**: UC3

```pseudo
// Arrange
git worktree list = [
  { path: "../repo.worktree/feature-a", branch: "feature-a" },
  { path: "../repo.worktree/feature-b", branch: "feature-b" }
]
sessions.json = { sessions: [] }  // No sessions attached

// Act
csq attach  # User selects "feature-a" via fzf

// Assert
expect(sessions.json.sessions).toHaveLength(1)
expect(sessions.json.sessions[0].worktreePath).toBe("../repo.worktree/feature-a")
expect(terminal).toBeOpenedAt("../repo.worktree/feature-a")
```

### TS8: AttachWorktree - Filter Already Attached

**Use Case**: UC3

```pseudo
// Arrange
git worktree list = [
  { path: "../repo.worktree/feature-a", branch: "feature-a" },
  { path: "../repo.worktree/feature-b", branch: "feature-b" }
]
sessions.json = {
  sessions: [{ worktreePath: "../repo.worktree/feature-a", ... }]
}

// Act
result = csq attach

// Assert
expect(fzf_options).toContain("feature-b")
expect(fzf_options).NOT.toContain("feature-a")  // Already attached
```

### TS9: CleanSessions - Remove Terminated

**Use Case**: UC4

```pseudo
// Arrange
sessions.json = {
  sessions: [
    { id: "abc", name: "old-session", worktreePath: "/path/worktree" }
  ]
}
locks/abc.lock does NOT exist (terminated)

// Act
csq clean  # User confirms deletion, selects "delete worktree too"

// Assert
expect(sessions.json.sessions).toHaveLength(0)
expect(git_worktree_remove).toHaveBeenCalledWith("/path/worktree")
```

### TS10: CleanSessions - Keep Worktree

**Use Case**: UC4

```pseudo
// Arrange
sessions.json = {
  sessions: [
    { id: "abc", name: "old-session", worktreePath: "/path/worktree" }
  ]
}
locks/abc.lock does NOT exist (terminated)

// Act
csq clean  # User selects "keep worktree"

// Assert
expect(sessions.json.sessions).toHaveLength(0)
expect(git_worktree_remove).NOT.toHaveBeenCalled()
expect(worktree).toStillExist()
```

### TS11: InitConfig - Create Default

**Use Case**: UC5

```pseudo
// Arrange
.code-squad/ does NOT exist

// Act
csq config init

// Assert
expect(.code-squad/config.yml).toExist()
expect(.code-squad/config.yml).toContain("worktree:")
expect(.code-squad/config.yml).toContain("basePath:")
expect(stdout).toContain("Add .code-squad/ to .gitignore")
```

### TS12: InitConfig - Already Exists

**Use Case**: UC5

```pseudo
// Arrange
.code-squad/config.yml already exists

// Act
result = csq config init

// Assert
expect(result).toContain("already exists")
expect(.code-squad/config.yml).NOT.toBeOverwritten()
```

### TS13: EditConfig - Open Editor

**Use Case**: UC6

```pseudo
// Arrange
.code-squad/config.yml exists
EDITOR = "vim"

// Act
csq config

// Assert
expect(vim).toBeOpenedWith(".code-squad/config.yml")
```

### TS14: EditConfig - Auto Init

**Use Case**: UC6

```pseudo
// Arrange
.code-squad/config.yml does NOT exist
EDITOR = "vim"

// Act
csq config

// Assert
expect(.code-squad/config.yml).toBeCreated()  // Auto init
expect(vim).toBeOpenedWith(".code-squad/config.yml")
```

### TS15: TUI - Main Dashboard

**Use Case**: UC6 (TUI)

```pseudo
// Arrange
sessions = [
  { name: "feature-a", status: "active" },
  { name: "feature-b", status: "terminated" }
]
worktrees = [
  { branch: "feature-c" }  // Not attached
]

// Act
csq  # No arguments = TUI mode

// Assert
expect(display).toContain("Active Sessions")
expect(display).toContain("feature-a [active]")
expect(display).toContain("feature-b [terminated]")
expect(display).toContain("Available Worktrees")
expect(display).toContain("feature-c")
expect(display).toContain("[n] New session")
expect(display).toContain("[c] Clean sessions")
```

**Note**: Review these test scenarios before implementation. If any scenario is incorrect, update before coding.

## Task List

| Task | Description | Layer | Dependencies | Test Scenarios |
|------|-------------|-------|--------------|----------------|
| task-1 | Package setup & entry point | Infrastructure | - | - |
| task-2 | Config management (init, read, edit) | Infrastructure | task-1 | TS11, TS12, TS13, TS14 |
| task-3 | Session utilities (CRUD, lock management) | Infrastructure | task-1, task-2 | - |
| task-4 | Worktree utilities (list, create, remove) | Infrastructure | task-1 | - |
| task-5 | Terminal opener utilities | Infrastructure | task-1, task-2 | - |
| task-6 | List command | Application | task-3 | TS1, TS2, TS3 |
| task-7 | New command (create session) | Application | task-3, task-4, task-5 | TS4, TS5, TS6 |
| task-8 | Attach command | Application | task-3, task-4, task-5 | TS7, TS8 |
| task-9 | Clean command | Application | task-3, task-4 | TS9, TS10 |
| task-10 | Main TUI dashboard | Application | task-6, task-7, task-8, task-9 | TS15 |

## Testing Strategy

### Unit Testing

Shell functions can be tested with `bats` (Bash Automated Testing System):

```bash
# Example test structure
#!/usr/bin/env bats

@test "get_session_status returns active for running process" {
    # Setup
    echo "$$" > "$TEMP_LOCKS/test.lock"

    # Execute
    run get_session_status "test"

    # Assert
    [ "$status" -eq 0 ]
    [ "$output" = "active" ]
}
```

### Integration Testing

Manual verification with actual git repositories:

1. Create test repo
2. Run CLI commands
3. Verify file system state
4. Verify git worktree state

### Smoke Testing

After all tasks complete, run through success criteria from spec:

- [ ] `csq` displays TUI
- [ ] `csq new` creates session
- [ ] `csq attach` connects to worktree
- [ ] `csq list` shows sessions
- [ ] `csq clean` removes terminated sessions
- [ ] `csq config init` creates config
