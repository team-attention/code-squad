# Spec: Auto-copy Gitignored Files on Worktree Creation

## Summary

When creating a new worktree-isolated thread, automatically copy gitignored files (like `.env`, config files) from the main workspace to the new worktree based on user-defined glob patterns, enabling immediate productivity in the new worktree without manual file copying.

## Background

When a user creates a new thread with worktree isolation mode, git creates a fresh working directory. However, gitignored files (environment variables, local configurations, build outputs) are not tracked by git and therefore don't exist in the new worktree. This forces users to manually copy necessary files every time they create a new worktree, creating friction in the workflow.

This feature eliminates that manual step by automatically copying specified gitignored files from the main workspace to the new worktree during thread creation.

## Requirements

### Functional

- [ ] Accept glob pattern configuration for files to copy
- [ ] Support both global (user-level) and project-level (workspace-level) configuration
- [ ] Merge global and project configurations following VSCode settings precedence
- [ ] Automatically copy matching files after worktree creation succeeds
- [ ] Copy files while preserving directory structure
- [ ] Only perform copy operation when isolation mode is 'worktree'
- [ ] Handle non-existent source files gracefully (skip without error)
- [ ] Handle copy failures without blocking thread creation

### Non-Functional

- [ ] Copy operation should complete quickly (< 1 second for typical use cases)
- [ ] Configuration should follow VSCode settings conventions
- [ ] Minimal impact on CreateThreadUseCase execution time

## Use Cases

### UC1: Configure Copy Patterns Globally

- **Actor**: Developer
- **Trigger**: User wants certain files (e.g., `.env`) copied to all worktrees across all projects
- **Flow**:
  1. User opens VSCode settings (User scope)
  2. User adds glob patterns to `codeSquad.worktreeCopyPatterns` setting
  3. Patterns are stored in global VSCode settings
  4. These patterns apply to all worktree creations unless overridden
- **Business Rules**:
  - Glob patterns must be valid (standard glob syntax: `*`, `**`, `?`, etc.)
  - Array can be empty (no files copied)
  - Patterns are case-sensitive
- **Location**: VSCode settings UI / `settings.json`

### UC2: Configure Copy Patterns Per Project

- **Actor**: Developer
- **Trigger**: User wants project-specific files copied (in addition to global patterns)
- **Flow**:
  1. User opens VSCode settings (Workspace scope)
  2. User adds project-specific patterns to `codeSquad.worktreeCopyPatterns`
  3. Patterns are stored in `.vscode/settings.json`
  4. These patterns are merged with global patterns
- **Business Rules**:
  - Workspace settings merge with (not replace) user settings
  - VSCode handles setting precedence automatically
- **Location**: `.vscode/settings.json`

### UC3: Auto-copy Files on Worktree Creation

- **Actor**: System (CreateThreadUseCase)
- **Trigger**: User creates a new thread with `isolationMode: 'worktree'`
- **Flow**:
  1. CreateThreadUseCase creates worktree at target path
  2. System reads merged `codeSquad.worktreeCopyPatterns` setting
  3. System resolves glob patterns against main workspace directory
  4. For each matching file:
     - Copy file to worktree preserving relative path
     - Create parent directories if needed
  5. Thread creation completes normally
- **Business Rules**:
  - Only copy when `isolationMode === 'worktree'`
  - Copy happens after worktree creation succeeds
  - If pattern matches no files, proceed without error
  - If individual file copy fails, log warning but continue
  - If all copies fail, still complete thread creation successfully
  - Files are copied from `workspaceRoot` to `worktreePath`
- **Location**: `src/application/useCases/CreateThreadUseCase.ts`

### UC4: Handle Copy Errors Gracefully

- **Actor**: System
- **Trigger**: File copy operation fails (permissions, disk space, etc.)
- **Flow**:
  1. System attempts to copy file
  2. Copy operation throws error
  3. System logs warning with file path and error details
  4. System continues with remaining files
  5. Thread creation completes successfully
- **Business Rules**:
  - Individual file copy failures never block thread creation
  - Errors are logged for debugging but not shown to user
- **Location**: `src/application/useCases/CreateThreadUseCase.ts`

## UI/UX

No UI changes required. Configuration is done through standard VSCode settings interface.

User workflow:
1. Configure patterns once in settings
2. Create worktree threads as usual
3. Files are automatically copied in background

## Configuration

### Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `codeSquad.worktreeCopyPatterns` | `string[]` | `[]` | Glob patterns for files to copy from main workspace to worktrees. Supports standard glob syntax (`*`, `**`, `?`). Examples: `[".env", ".env.*", "config/local.json", "dist/**"]` |

### Setting Properties

```json
{
  "codeSquad.worktreeCopyPatterns": {
    "type": "array",
    "items": {
      "type": "string"
    },
    "default": [],
    "description": "Glob patterns for files to automatically copy when creating worktree threads",
    "scope": "machine-overridable"
  }
}
```

Scope `machine-overridable` allows:
- User-level configuration (global)
- Workspace-level configuration (project-specific)
- Automatic merging of both levels

## Out of Scope

- Interactive file selection UI during thread creation
- Bidirectional sync between main workspace and worktree
- Copying files back from worktree to main workspace
- Copy on worktree update/sync operations
- Pattern validation UI (VSCode handles invalid patterns gracefully)
- Progress indication for copy operations (assumed fast enough)

## Open Questions

None. The design is straightforward and leverages VSCode's existing configuration system.
