# Task 9: Clean Command

## Goal

Implement the `csq clean` command to remove terminated sessions and optionally their associated worktrees.

## Layer

Application

## Files

- `packages/cli/lib/commands/clean.sh` - Clean command implementation

## Implementation Steps

1. Create `lib/commands/clean.sh`:
   ```bash
   source "$LIB_DIR/utils/session.sh"
   source "$LIB_DIR/utils/config.sh"
   source "$LIB_DIR/utils/worktree.sh"

   cmd_clean() {
     ensure_in_git_repo
     ensure_config_exists

     local force=false
     local delete_worktrees=false
     local auto_yes=false

     # Parse arguments
     while [ $# -gt 0 ]; do
       case "$1" in
         --force|-f)
           force=true
           shift
           ;;
         --delete-worktrees|-d)
           delete_worktrees=true
           shift
           ;;
         --yes|-y)
           auto_yes=true
           shift
           ;;
         *)
           echo "Unknown option: $1"
           show_clean_help
           return 1
           ;;
       esac
     done

     # Get terminated sessions
     local terminated_sessions
     terminated_sessions=$(get_sessions_by_status "terminated")

     if [ -z "$terminated_sessions" ]; then
       echo "No terminated sessions to clean."
       return 0
     fi

     # Show terminated sessions
     echo "Terminated sessions:"
     echo ""
     echo "$terminated_sessions" | while IFS='|' read -r id name mode working_dir status created_at; do
       local worktree_info=""
       if [ "$mode" = "worktree" ]; then
         worktree_info=" (worktree)"
       fi
       echo "  - $name$worktree_info"
       echo "    Path: $working_dir"
     done
     echo ""

     # Confirm cleanup
     if [ "$auto_yes" != "true" ]; then
       if ! confirm_action "Clean these sessions?"; then
         echo "Cancelled."
         return 0
       fi
     fi

     # Ask about worktree deletion
     local should_delete_worktrees=false
     local has_worktrees
     has_worktrees=$(echo "$terminated_sessions" | grep -c "|worktree|" || echo "0")

     if [ "$has_worktrees" -gt 0 ] && [ "$delete_worktrees" != "true" ]; then
       if [ "$auto_yes" != "true" ]; then
         if confirm_action "Also delete associated worktrees?"; then
           should_delete_worktrees=true
         fi
       fi
     elif [ "$delete_worktrees" = "true" ]; then
       should_delete_worktrees=true
     fi

     # Clean each session
     local cleaned=0
     local failed=0

     echo "$terminated_sessions" | while IFS='|' read -r id name mode working_dir status created_at; do
       echo "Cleaning: $name..."

       # Check for uncommitted changes in worktree
       if [ "$mode" = "worktree" ] && [ "$should_delete_worktrees" = "true" ]; then
         if has_uncommitted_changes "$working_dir"; then
           if [ "$force" = "true" ]; then
             echo "  Warning: Uncommitted changes in $working_dir (forcing deletion)"
           else
             echo "  Skipping: Uncommitted changes in $working_dir"
             echo "  Use --force to delete anyway"
             failed=$((failed + 1))
             continue
           fi
         fi

         # Delete worktree
         echo "  Removing worktree..."
         if remove_worktree "$working_dir" "$force"; then
           echo "  Worktree removed."
         else
           echo "  Failed to remove worktree."
           failed=$((failed + 1))
         fi
       fi

       # Remove session
       remove_session "$id"
       echo "  Session cleaned."
       cleaned=$((cleaned + 1))
     done

     echo ""
     echo "Cleaned $cleaned session(s)."
     if [ "$failed" -gt 0 ]; then
       echo "Failed to clean $failed session(s)."
     fi
   }

   confirm_action() {
     local prompt="$1"

     if command -v gum &>/dev/null; then
       gum confirm "$prompt"
     else
       read -p "$prompt [y/N]: " response
       case "$response" in
         [yY][eE][sS]|[yY]) return 0 ;;
         *) return 1 ;;
       esac
     fi
   }

   show_clean_help() {
     cat <<EOF
   Usage: csq clean [options]

   Clean terminated sessions.

   Options:
     --force, -f           Force deletion even with uncommitted changes
     --delete-worktrees, -d  Also delete associated worktrees
     --yes, -y             Skip confirmation prompts

   Examples:
     csq clean              # Interactive cleanup
     csq clean -y           # Auto-confirm session cleanup
     csq clean -d -y        # Also delete worktrees, auto-confirm
     csq clean -d -f -y     # Force delete everything
   EOF
   }
   ```

2. Add safety checks:
   - Detect uncommitted changes in worktrees
   - Require `--force` to delete dirty worktrees
   - Confirm before destructive actions

3. Add interactive mode:
   - Use gum for confirmations if available
   - Fallback to simple y/N prompt
   - Allow multi-select for partial cleanup (future enhancement)

4. Add worktree cleanup:
   - Call `git worktree remove`
   - Handle force flag for dirty worktrees
   - Optionally delete the associated branch

## Test Scenarios

Link to main.md: TS9, TS10

### TDD Order

1. **TS9** (Remove Terminated with Worktree Deletion):
   ```bash
   # Setup
   csq config init
   csq new "old-session" --mode worktree
   # Kill the terminal process to make it terminated
   pkill -f "old-session" || true
   rm -f .code-squad/locks/*.lock

   # Execute
   echo "y" | csq clean -d

   # Assert
   sessions=$(cat .code-squad/sessions.json)
   [[ "$sessions" != *"old-session"* ]]

   # Worktree should be removed
   ! [ -d "../$(basename $(pwd)).worktree/old-session" ]
   ```

2. **TS10** (Keep Worktree):
   ```bash
   # Setup
   csq config init
   csq new "keep-worktree" --mode worktree
   local worktree_path="../$(basename $(pwd)).worktree/keep-worktree"

   # Kill the terminal
   pkill -f "keep-worktree" || true
   rm -f .code-squad/locks/*.lock

   # Execute (answer 'n' to worktree deletion)
   echo -e "y\nn" | csq clean

   # Assert
   sessions=$(cat .code-squad/sessions.json)
   [[ "$sessions" != *"keep-worktree"* ]]

   # Worktree should still exist
   [ -d "$worktree_path" ]

   # Cleanup manually
   git worktree remove "$worktree_path"
   ```

### Manual Verification

```bash
# Create and terminate a session
csq new "test-clean" --mode worktree
# Close the terminal manually

# Verify terminated
csq list
# Should show [terminated]

# Clean with worktree
csq clean -d
# Should ask for confirmation, then clean

# Create dirty worktree
csq new "dirty-test" --mode worktree
# In the worktree terminal: echo "change" > test.txt
# Close terminal

csq clean -d
# Should warn about uncommitted changes

csq clean -d -f
# Should force delete
```

## Verification

- [ ] Shows "No terminated sessions" when all active
- [ ] Lists terminated sessions before cleaning
- [ ] Asks for confirmation before cleaning
- [ ] `--yes` skips confirmation
- [ ] Sessions are removed from sessions.json
- [ ] Lock files are removed
- [ ] Worktrees are deleted when `-d` flag used
- [ ] Uncommitted changes block deletion without `--force`
- [ ] `--force` overrides uncommitted change check
- [ ] Summary shows cleaned/failed counts
