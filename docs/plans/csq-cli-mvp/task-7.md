# Task 7: New Command (Create Session)

## Goal

Implement the `csq new` command to create new sessions in Local or Worktree mode.

## Layer

Application

## Files

- `packages/cli/lib/commands/new.sh` - New session command implementation

## Implementation Steps

1. Create `lib/commands/new.sh`:
   ```bash
   source "$LIB_DIR/utils/session.sh"
   source "$LIB_DIR/utils/config.sh"
   source "$LIB_DIR/utils/worktree.sh"
   source "$LIB_DIR/utils/terminal.sh"

   cmd_new() {
     ensure_in_git_repo
     ensure_config_exists

     local name=""
     local mode=""

     # Parse arguments
     while [ $# -gt 0 ]; do
       case "$1" in
         --mode)
           mode="$2"
           shift 2
           ;;
         -*)
           echo "Unknown option: $1"
           show_new_help
           return 1
           ;;
         *)
           name="$1"
           shift
           ;;
       esac
     done

     # Interactive mode if name not provided
     if [ -z "$name" ]; then
       name=$(prompt_session_name)
     fi

     # Interactive mode if mode not provided
     if [ -z "$mode" ]; then
       mode=$(prompt_session_mode)
     fi

     # Validate mode
     case "$mode" in
       local|worktree) ;;
       *)
         echo "Invalid mode: $mode. Use 'local' or 'worktree'."
         return 1
         ;;
     esac

     create_session "$name" "$mode"
   }

   prompt_session_name() {
     if command -v gum &>/dev/null; then
       gum input --placeholder "Session name..."
     else
       read -p "Session name: " name
       echo "$name"
     fi
   }

   prompt_session_mode() {
     if command -v gum &>/dev/null; then
       gum choose "local" "worktree"
     else
       echo "Select mode:" >&2
       echo "  1) local - Use current directory" >&2
       echo "  2) worktree - Create new git worktree" >&2
       read -p "Choice [1/2]: " choice
       case "$choice" in
         1|local) echo "local" ;;
         2|worktree) echo "worktree" ;;
         *) echo "local" ;;
       esac
     fi
   }

   create_session() {
     local name="$1"
     local mode="$2"
     local repo_root
     repo_root=$(git rev-parse --show-toplevel)

     local session_id
     session_id=$(generate_uuid)

     local working_dir="$repo_root"
     local branch=""
     local worktree_path=""

     if [ "$mode" = "worktree" ]; then
       worktree_path=$(get_new_worktree_path "$name")
       branch="$name"

       echo "Creating worktree at: $worktree_path"
       create_worktree "$worktree_path" "$branch"

       # Copy configured files
       local copy_patterns
       copy_patterns=$(config_get "worktree.copyPatterns")
       if [ -n "$copy_patterns" ]; then
         echo "Copying files..."
         copy_worktree_files "$repo_root" "$worktree_path" "$copy_patterns"
       fi

       working_dir="$worktree_path"
     fi

     echo "Opening terminal..."
     open_terminal "$working_dir" "$name"
     local pid
     pid=$(get_terminal_pid)

     # Save session
     add_session "$session_id" "$name" "$mode" "$working_dir" "$branch" "$worktree_path" "$pid"
     create_lock "$session_id" "$pid"

     echo ""
     echo "Session created: $name"
     echo "  ID: $session_id"
     echo "  Mode: $mode"
     echo "  Working dir: $working_dir"
   }

   show_new_help() {
     cat <<EOF
   Usage: csq new [name] [options]

   Create a new session.

   Arguments:
     name          Session name (prompted if not provided)

   Options:
     --mode MODE   Session mode: 'local' or 'worktree'

   Examples:
     csq new feature-auth --mode worktree
     csq new bugfix-123 --mode local
     csq new  # Interactive mode
   EOF
   }
   ```

2. Add input validation:
   - Session name format (no special characters that break paths)
   - Check if worktree path already exists
   - Check if branch already exists (for worktree mode)

3. Add error handling:
   - Worktree creation failure
   - Terminal opening failure
   - File copy failures (log but continue)

4. Add progress feedback:
   - Show steps as they happen
   - Use gum spinner if available

## Test Scenarios

Link to main.md: TS4, TS5, TS6

### TDD Order

1. **TS4** (Local Mode):
   ```bash
   # Setup
   csq config init

   # Execute
   csq new "test-session" --mode local

   # Assert
   sessions=$(cat .code-squad/sessions.json)
   [[ "$sessions" == *"test-session"* ]]
   [[ "$sessions" == *'"mode":"local"'* ]]
   [ -f ".code-squad/locks/"*.lock ]
   # Terminal should be open in current directory
   ```

2. **TS5** (Worktree Mode):
   ```bash
   # Setup
   csq config init
   # Edit config to set worktree.basePath and copyPatterns

   # Execute
   csq new "feature-x" --mode worktree

   # Assert
   # Worktree should exist
   [ -d "../$(basename $(pwd)).worktree/feature-x" ]

   # Branch should exist
   git branch --list | grep -q "feature-x"

   # Session should be saved
   sessions=$(cat .code-squad/sessions.json)
   [[ "$sessions" == *'"mode":"worktree"'* ]]
   [[ "$sessions" == *"worktreePath"* ]]

   # Configured files should be copied
   [ -d "../$(basename $(pwd)).worktree/feature-x/node_modules" ]
   ```

3. **TS6** (Init Command Execution):
   ```bash
   # Setup
   csq config init
   # Set terminal.initCommand to "echo 'INIT_RAN' > /tmp/csq-init-test"

   # Execute
   csq new "test" --mode local

   # Assert (wait for terminal to execute)
   sleep 2
   [ -f "/tmp/csq-init-test" ]
   ```

### Manual Verification

```bash
# Interactive mode
csq new
# Should prompt for name and mode

# With arguments
csq new my-feature --mode worktree
csq list
# Should show new session

# Verify worktree
git worktree list
# Should include new worktree

# Cleanup for testing
csq clean
git worktree remove ../repo.worktree/my-feature
```

## Verification

- [ ] `csq new name --mode local` creates local session
- [ ] `csq new name --mode worktree` creates worktree session
- [ ] Interactive prompts work when args missing
- [ ] Session is saved to sessions.json
- [ ] Lock file is created
- [ ] Terminal opens in correct directory
- [ ] Worktree is created with correct branch
- [ ] Files matching copyPatterns are copied
- [ ] Init command is executed if configured
- [ ] Error messages are clear for failures
