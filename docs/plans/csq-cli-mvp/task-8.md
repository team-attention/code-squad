# Task 8: Attach Command

## Goal

Implement the `csq attach` command to connect to existing worktrees that don't have an active session.

## Layer

Application

## Files

- `packages/cli/lib/commands/attach.sh` - Attach command implementation

## Implementation Steps

1. Create `lib/commands/attach.sh`:
   ```bash
   source "$LIB_DIR/utils/session.sh"
   source "$LIB_DIR/utils/config.sh"
   source "$LIB_DIR/utils/worktree.sh"
   source "$LIB_DIR/utils/terminal.sh"

   cmd_attach() {
     ensure_in_git_repo
     ensure_config_exists

     local worktree_path="$1"

     # Get available worktrees (not attached to sessions)
     local available_worktrees
     available_worktrees=$(get_available_worktrees)

     if [ -z "$available_worktrees" ]; then
       echo "No available worktrees to attach."
       echo ""
       echo "All worktrees are already attached to sessions, or no worktrees exist."
       echo "Create a new worktree with: csq new <name> --mode worktree"
       return 0
     fi

     # If path not provided, show selection
     if [ -z "$worktree_path" ]; then
       worktree_path=$(select_worktree "$available_worktrees")
       if [ -z "$worktree_path" ]; then
         echo "No worktree selected."
         return 0
       fi
     else
       # Validate provided path
       if ! is_valid_worktree "$worktree_path"; then
         echo "Invalid worktree path: $worktree_path"
         return 1
       fi

       # Check if already attached
       if is_worktree_attached "$worktree_path"; then
         echo "Worktree already has an active session."
         return 1
       fi
     fi

     attach_to_worktree "$worktree_path"
   }

   select_worktree() {
     local worktrees="$1"

     if command -v fzf &>/dev/null; then
       # Format for fzf: "path (branch)"
       local formatted
       formatted=$(echo "$worktrees" | while IFS='|' read -r path branch head; do
         echo "$path ($branch)"
       done)

       local selected
       selected=$(echo "$formatted" | fzf --prompt="Select worktree: " --height=10)

       if [ -n "$selected" ]; then
         # Extract path from selection
         echo "$selected" | sed 's/ (.*$//'
       fi
     elif command -v gum &>/dev/null; then
       local paths
       paths=$(echo "$worktrees" | cut -d'|' -f1)
       gum choose $paths
     else
       # Fallback: numbered list
       echo "Available worktrees:" >&2
       local i=1
       echo "$worktrees" | while IFS='|' read -r path branch head; do
         echo "  $i) $path ($branch)" >&2
         i=$((i + 1))
       done

       read -p "Select [1-n]: " choice
       echo "$worktrees" | sed -n "${choice}p" | cut -d'|' -f1
     fi
   }

   is_worktree_attached() {
     local path="$1"
     local attached_paths
     attached_paths=$(get_attached_worktree_paths)
     echo "$attached_paths" | grep -qF "$path"
   }

   get_attached_worktree_paths() {
     # Get worktreePath from all sessions
     local sessions_file
     sessions_file=$(get_sessions_path)

     if [ -f "$sessions_file" ] && command -v jq &>/dev/null; then
       jq -r '.sessions[].worktreePath // empty' "$sessions_file"
     else
       # Fallback: grep for worktreePath
       grep -o '"worktreePath":"[^"]*"' "$sessions_file" 2>/dev/null | cut -d'"' -f4
     fi
   }

   attach_to_worktree() {
     local worktree_path="$1"

     # Get branch name from worktree
     local branch
     branch=$(get_worktree_branch "$worktree_path")

     # Use branch as session name
     local name="$branch"

     local session_id
     session_id=$(generate_uuid)

     echo "Attaching to worktree: $worktree_path"
     echo "Branch: $branch"

     # Open terminal
     echo "Opening terminal..."
     open_terminal "$worktree_path" "$name"
     local pid
     pid=$(get_terminal_pid)

     # Save session
     add_session "$session_id" "$name" "worktree" "$worktree_path" "$branch" "$worktree_path" "$pid"
     create_lock "$session_id" "$pid"

     echo ""
     echo "Session created: $name"
     echo "  ID: $session_id"
     echo "  Worktree: $worktree_path"
   }

   show_attach_help() {
     cat <<EOF
   Usage: csq attach [worktree-path]

   Attach to an existing worktree.

   Arguments:
     worktree-path   Path to worktree (prompted if not provided)

   Examples:
     csq attach ../my-project.worktree/feature-x
     csq attach  # Interactive selection with fzf
   EOF
   }
   ```

2. Add worktree validation:
   - Check path exists
   - Check it's a valid git worktree
   - Check it's not already attached to a session

3. Add interactive selection:
   - Use fzf for fuzzy finding
   - Fallback to gum or numbered list
   - Show branch name alongside path

4. Integrate with session creation:
   - Reuse session utilities from task-3
   - Use worktree branch as session name

## Test Scenarios

Link to main.md: TS7, TS8

### TDD Order

1. **TS7** (Select and Attach):
   ```bash
   # Setup
   csq config init
   git worktree add ../test.worktree/feature-a -b feature-a
   git worktree add ../test.worktree/feature-b -b feature-b
   # No sessions exist

   # Execute (simulating fzf selection)
   echo "../test.worktree/feature-a" | csq attach

   # Assert
   sessions=$(cat .code-squad/sessions.json)
   [[ "$sessions" == *"feature-a"* ]]
   [[ "$sessions" == *'"worktreePath":"../test.worktree/feature-a"'* ]]
   [ -f ".code-squad/locks/"*.lock ]

   # Cleanup
   git worktree remove ../test.worktree/feature-a
   git worktree remove ../test.worktree/feature-b
   ```

2. **TS8** (Filter Already Attached):
   ```bash
   # Setup
   csq config init
   git worktree add ../test.worktree/feature-a -b feature-a
   git worktree add ../test.worktree/feature-b -b feature-b

   # Attach to feature-a first
   csq attach ../test.worktree/feature-a

   # Execute
   available=$(get_available_worktrees)

   # Assert
   [[ "$available" == *"feature-b"* ]]
   [[ "$available" != *"feature-a"* ]]  # Should be filtered out

   # Cleanup
   git worktree remove ../test.worktree/feature-a
   git worktree remove ../test.worktree/feature-b
   ```

### Manual Verification

```bash
# Create test worktrees
git worktree add ../test.worktree/wt-1 -b wt-1
git worktree add ../test.worktree/wt-2 -b wt-2

# Interactive attach
csq attach
# Should show wt-1 and wt-2 in fzf

# Direct attach
csq attach ../test.worktree/wt-1

# Verify filtering
csq attach
# Should only show wt-2 now

# Cleanup
git worktree remove ../test.worktree/wt-1
git worktree remove ../test.worktree/wt-2
csq clean
```

## Verification

- [ ] Shows "No available worktrees" when none exist
- [ ] Shows "No available worktrees" when all attached
- [ ] fzf selection works correctly
- [ ] Fallback selection works without fzf
- [ ] Direct path argument works
- [ ] Invalid path shows error
- [ ] Already attached worktree shows error
- [ ] Session is created with worktree mode
- [ ] Terminal opens in worktree directory
- [ ] Branch name is used as session name
