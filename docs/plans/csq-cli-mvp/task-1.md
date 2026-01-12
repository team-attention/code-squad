# Task 1: Package Setup & Entry Point

## Goal

Create the CLI package structure with the main entry point script that routes commands to appropriate handlers.

## Layer

Infrastructure

## Files

- `packages/cli/bin/csq` - Main entry point (shell script)
- `packages/cli/lib/common.sh` - Shared utilities and constants
- `packages/cli/package.json` - Package metadata
- `packages/cli/README.md` - Usage documentation

## Implementation Steps

1. Create package directory structure:
   ```
   packages/cli/
   ├── bin/
   │   └── csq
   ├── lib/
   │   ├── commands/
   │   ├── utils/
   │   └── common.sh
   ├── package.json
   └── README.md
   ```

2. Create `bin/csq` entry point:
   ```bash
   #!/usr/bin/env bash
   set -euo pipefail

   # Resolve script directory
   SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
   LIB_DIR="$SCRIPT_DIR/../lib"

   # Source common utilities
   source "$LIB_DIR/common.sh"

   # Parse command and delegate
   case "${1:-}" in
     list|ls)    source "$LIB_DIR/commands/list.sh"; cmd_list "${@:2}" ;;
     new)        source "$LIB_DIR/commands/new.sh"; cmd_new "${@:2}" ;;
     attach)     source "$LIB_DIR/commands/attach.sh"; cmd_attach "${@:2}" ;;
     clean)      source "$LIB_DIR/commands/clean.sh"; cmd_clean "${@:2}" ;;
     config)     source "$LIB_DIR/commands/config.sh"; cmd_config "${@:2}" ;;
     help|--help|-h) show_help ;;
     "")         source "$LIB_DIR/ui/tui.sh"; cmd_tui ;;
     *)          echo "Unknown command: $1"; show_help; exit 1 ;;
   esac
   ```

3. Create `lib/common.sh` with shared utilities:
   - Constants (CSQ_DIR, CONFIG_FILE, SESSIONS_FILE, LOCKS_DIR)
   - Git repository detection
   - Error handling utilities
   - Color output helpers
   - Dependency checking (fzf, gum)

4. Create `package.json`:
   ```json
   {
     "name": "@code-squad/cli",
     "version": "0.1.0",
     "description": "CLI for managing worktree-based AI coding sessions",
     "bin": {
       "csq": "./bin/csq"
     },
     "files": ["bin", "lib"],
     "repository": {
       "type": "git",
       "url": "https://github.com/team-attention/code-squad.git",
       "directory": "packages/cli"
     }
   }
   ```

5. Create placeholder command files for structure validation

## Test Scenarios

No specific test scenarios - this is infrastructure setup.

### Manual Verification

```bash
# Should show help
./packages/cli/bin/csq --help

# Should fail gracefully outside git repo
cd /tmp && ./path/to/csq

# Should detect missing dependencies
# (temporarily rename fzf and check error message)
```

## Verification

- [ ] `csq --help` displays help message
- [ ] `csq` without args shows "TUI not implemented yet" (placeholder)
- [ ] Running outside git repo shows appropriate error
- [ ] Missing fzf/gum shows installation instructions
- [ ] All command placeholders exist (list, new, attach, clean, config)
