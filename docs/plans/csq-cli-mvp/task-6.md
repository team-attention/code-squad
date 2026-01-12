# Task 6: List Command

## Goal

Implement the `csq list` command to display all sessions with their current status.

## Layer

Application

## Files

- `packages/cli/lib/commands/list.sh` - List command implementation

## Implementation Steps

1. Create `lib/commands/list.sh`:
   ```bash
   source "$LIB_DIR/utils/session.sh"
   source "$LIB_DIR/utils/config.sh"

   cmd_list() {
     ensure_in_git_repo
     ensure_config_exists

     local sessions
     sessions=$(get_all_sessions_with_status)

     if [ -z "$sessions" ] || [ "$sessions" = "[]" ]; then
       echo "No sessions found."
       echo ""
       echo "Create a new session with: csq new <name>"
       return
     fi

     echo "Sessions:"
     echo ""

     # Table header
     printf "%-12s %-20s %-10s %-30s\n" "STATUS" "NAME" "MODE" "WORKING DIR"
     printf "%-12s %-20s %-10s %-30s\n" "------" "----" "----" "-----------"

     # List sessions
     echo "$sessions" | while IFS='|' read -r id name mode working_dir status created_at; do
       local status_display
       case "$status" in
         active)
           status_display=$(color_green "[active]")
           ;;
         terminated)
           status_display=$(color_yellow "[terminated]")
           ;;
       esac

       # Truncate working dir if too long
       local dir_display
       if [ ${#working_dir} -gt 28 ]; then
         dir_display="...${working_dir: -25}"
       else
         dir_display="$working_dir"
       fi

       printf "%-12s %-20s %-10s %-30s\n" "$status_display" "$name" "$mode" "$dir_display"
     done

     echo ""

     # Summary
     local active_count terminated_count
     active_count=$(echo "$sessions" | grep -c "|active|" || echo "0")
     terminated_count=$(echo "$sessions" | grep -c "|terminated|" || echo "0")

     echo "$active_count active, $terminated_count terminated"

     if [ "$terminated_count" -gt 0 ]; then
       echo ""
       echo "Clean terminated sessions with: csq clean"
     fi
   }

   # Helper to format session for display
   format_session_line() {
     local id="$1"
     local name="$2"
     local mode="$3"
     local working_dir="$4"
     local status="$5"

     # Format for table display
   }

   # Alternative: JSON output for scripting
   cmd_list_json() {
     ensure_in_git_repo
     ensure_config_exists

     local sessions_file
     sessions_file=$(get_sessions_path)

     if [ -f "$sessions_file" ]; then
       # Add status to each session
       if command -v jq &>/dev/null; then
         jq '.sessions | map(. + {"status": "TODO"})' "$sessions_file"
       else
         cat "$sessions_file"
       fi
     else
       echo '{"sessions":[]}'
     fi
   }
   ```

2. Add output formatting:
   - Color coding for status (green=active, yellow=terminated)
   - Table format with aligned columns
   - Truncation for long paths
   - Summary counts at bottom

3. Add filtering options:
   ```bash
   cmd_list() {
     local filter=""
     while [ $# -gt 0 ]; do
       case "$1" in
         --active) filter="active" ;;
         --terminated) filter="terminated" ;;
         --json) cmd_list_json; return ;;
         *) echo "Unknown option: $1"; return 1 ;;
       esac
       shift
     done
     # ... rest of implementation with filter applied
   }
   ```

4. Add error handling:
   - Not in git repo
   - No config file
   - Corrupted sessions.json

## Test Scenarios

Link to main.md: TS1, TS2, TS3

### TDD Order

1. **TS1** (Happy Path - Active Session):
   ```bash
   # Setup
   echo '{"sessions":[{"id":"abc","name":"feature-a","mode":"worktree","workingDir":"/path","pid":1234}]}' > .code-squad/sessions.json
   echo "$$" > .code-squad/locks/abc.lock  # Current shell PID = active

   # Execute
   result=$(csq list)

   # Assert
   [[ "$result" == *"feature-a"* ]]
   [[ "$result" == *"active"* ]]
   ```

2. **TS2** (Terminated - Dead PID):
   ```bash
   # Setup
   echo '{"sessions":[{"id":"abc","name":"feature-a","mode":"worktree","workingDir":"/path","pid":1234}]}' > .code-squad/sessions.json
   echo "99999" > .code-squad/locks/abc.lock  # Dead PID

   # Execute
   result=$(csq list)

   # Assert
   [[ "$result" == *"feature-a"* ]]
   [[ "$result" == *"terminated"* ]]
   ```

3. **TS3** (Terminated - No Lock):
   ```bash
   # Setup
   echo '{"sessions":[{"id":"abc","name":"feature-a","mode":"worktree","workingDir":"/path","pid":1234}]}' > .code-squad/sessions.json
   rm -f .code-squad/locks/abc.lock  # No lock file

   # Execute
   result=$(csq list)

   # Assert
   [[ "$result" == *"feature-a"* ]]
   [[ "$result" == *"terminated"* ]]
   ```

### Manual Verification

```bash
# Empty state
rm -rf .code-squad
csq config init
csq list
# Should show "No sessions found"

# With sessions
# (Create sessions manually for testing)
csq list
csq list --active
csq list --json
```

## Verification

- [ ] Shows "No sessions found" when empty
- [ ] Displays active sessions with green status
- [ ] Displays terminated sessions with yellow status
- [ ] Correctly detects status from lock file + PID
- [ ] Table format is properly aligned
- [ ] Long paths are truncated
- [ ] Summary counts are accurate
- [ ] `--json` outputs valid JSON
- [ ] Filter flags work correctly
