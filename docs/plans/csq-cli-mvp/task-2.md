# Task 2: Config Management

## Goal

Implement configuration initialization, reading, and editing functionality.

## Layer

Infrastructure

## Files

- `packages/cli/lib/utils/config.sh` - Config read/write utilities
- `packages/cli/lib/commands/config.sh` - Config command handler

## Implementation Steps

1. Create `lib/utils/config.sh`:
   ```bash
   # Constants
   CONFIG_FILE=".code-squad/config.yml"
   DEFAULT_CONFIG='worktree:
     basePath: "../{repo}.worktree"
     copyPatterns:
       - "node_modules"
       - ".env*"
       - "dist"

   terminal:
     opener: "native"
     initCommand: ""
   '

   # Check if config exists
   config_exists() {
     [ -f "$CONFIG_FILE" ]
   }

   # Initialize config with defaults
   config_init() {
     local repo_root
     repo_root=$(git rev-parse --show-toplevel 2>/dev/null) || return 1
     local csq_dir="$repo_root/.code-squad"

     if [ -f "$csq_dir/config.yml" ]; then
       echo "Config already exists: $csq_dir/config.yml"
       return 1
     fi

     mkdir -p "$csq_dir/locks"
     echo "$DEFAULT_CONFIG" > "$csq_dir/config.yml"
     echo '{"sessions":[]}' > "$csq_dir/sessions.json"
     echo "Created $csq_dir/config.yml"
     echo "Tip: Add .code-squad/ to your .gitignore"
   }

   # Read config value (using grep/sed for YAML parsing)
   config_get() {
     local key="$1"
     # Simple YAML parsing for our known structure
     # For basePath, copyPatterns, opener, initCommand
   }

   # Get resolved worktree base path
   get_worktree_base_path() {
     local repo_name
     repo_name=$(basename "$(git rev-parse --show-toplevel)")
     local pattern
     pattern=$(config_get "worktree.basePath")
     echo "${pattern//\{repo\}/$repo_name}"
   }
   ```

2. Create `lib/commands/config.sh`:
   ```bash
   cmd_config() {
     local subcmd="${1:-edit}"

     case "$subcmd" in
       init)
         config_init
         ;;
       edit|"")
         if ! config_exists; then
           echo "No config found. Creating default config..."
           config_init
         fi
         ${EDITOR:-vim} "$(get_config_path)"
         ;;
       show)
         if config_exists; then
           cat "$(get_config_path)"
         else
           echo "No config found. Run 'csq config init' first."
           exit 1
         fi
         ;;
       *)
         echo "Unknown config subcommand: $subcmd"
         echo "Usage: csq config [init|edit|show]"
         exit 1
         ;;
     esac
   }
   ```

3. Add YAML parsing helpers:
   - Simple line-based parsing (no external dependencies)
   - Support nested keys via dot notation: `worktree.basePath`
   - Handle array values for `copyPatterns`

4. Add `.code-squad/` directory structure management:
   - Auto-create locks directory
   - Initialize empty sessions.json

## Test Scenarios

Link to main.md: TS11, TS12, TS13, TS14

### TDD Order

1. **TS11** (Init - Create Default):
   - Test that `csq config init` creates `.code-squad/config.yml`
   - Verify default content includes required keys
   - Verify locks directory is created

2. **TS12** (Init - Already Exists):
   - Create existing config
   - Run `csq config init`
   - Verify error message and file not overwritten

3. **TS13** (Edit - Open Editor):
   - Set EDITOR env var
   - Run `csq config`
   - Verify editor is invoked with correct path

4. **TS14** (Edit - Auto Init):
   - Ensure no config exists
   - Run `csq config`
   - Verify config is created then editor opens

### Manual Test Commands

```bash
# TS11: Create default config
rm -rf .code-squad
csq config init
cat .code-squad/config.yml

# TS12: Already exists error
csq config init  # Should error

# TS13: Open in editor
EDITOR=cat csq config  # Should cat the file

# TS14: Auto init
rm -rf .code-squad
EDITOR=cat csq config  # Should create then show
```

## Verification

- [ ] `csq config init` creates default config
- [ ] `csq config init` fails gracefully if config exists
- [ ] `csq config` opens editor (auto-init if needed)
- [ ] `csq config show` displays current config
- [ ] Config values can be read via `config_get`
- [ ] `{repo}` placeholder is resolved correctly
