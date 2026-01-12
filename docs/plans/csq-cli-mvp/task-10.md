# Task 10: Main TUI Dashboard

## Goal

Implement the interactive TUI dashboard shown when running `csq` without arguments.

## Layer

Application

## Files

- `packages/cli/lib/ui/tui.sh` - TUI dashboard implementation

## Implementation Steps

1. Create `lib/ui/tui.sh`:
   ```bash
   source "$LIB_DIR/utils/session.sh"
   source "$LIB_DIR/utils/config.sh"
   source "$LIB_DIR/utils/worktree.sh"

   cmd_tui() {
     ensure_in_git_repo

     # Check if config exists, offer to create
     if ! config_exists; then
       if confirm_action "No config found. Create default config?"; then
         config_init
       else
         echo "Run 'csq config init' to create config."
         return 0
       fi
     fi

     while true; do
       clear
       show_dashboard
       handle_input
       local result=$?
       if [ $result -eq 1 ]; then
         break  # Exit
       fi
     done
   }

   show_dashboard() {
     local repo_name
     repo_name=$(basename "$(git rev-parse --show-toplevel)")

     echo "==================================="
     echo "  Code Squad - $repo_name"
     echo "==================================="
     echo ""

     # Active Sessions
     show_sessions_section

     echo ""

     # Available Worktrees
     show_worktrees_section

     echo ""
     echo "-----------------------------------"
     echo "  [n] New session"
     echo "  [a] Attach to worktree"
     echo "  [c] Clean terminated sessions"
     echo "  [r] Refresh"
     echo "  [q] Quit"
     echo "-----------------------------------"
   }

   show_sessions_section() {
     echo "Sessions:"

     local sessions
     sessions=$(get_all_sessions_with_status)

     if [ -z "$sessions" ]; then
       echo "  (none)"
       return
     fi

     local active_count=0
     local terminated_count=0

     echo "$sessions" | while IFS='|' read -r id name mode working_dir status created_at; do
       local status_icon
       case "$status" in
         active)
           status_icon=$(color_green "[*]")
           active_count=$((active_count + 1))
           ;;
         terminated)
           status_icon=$(color_yellow "[-]")
           terminated_count=$((terminated_count + 1))
           ;;
       esac

       local mode_label=""
       if [ "$mode" = "worktree" ]; then
         mode_label=" (wt)"
       fi

       echo "  $status_icon $name$mode_label"
     done

     # Show counts
     local total
     total=$(echo "$sessions" | wc -l | tr -d ' ')
     echo ""
     echo "  Total: $total"
   }

   show_worktrees_section() {
     echo "Available Worktrees:"

     local available
     available=$(get_available_worktrees)

     if [ -z "$available" ]; then
       echo "  (none)"
       return
     fi

     echo "$available" | while IFS='|' read -r path branch head; do
       local short_path
       short_path=$(basename "$path")
       echo "  - $short_path ($branch)"
     done
   }

   handle_input() {
     local key
     read -rsn1 key

     case "$key" in
       n|N)
         clear
         cmd_new
         echo ""
         read -p "Press Enter to continue..."
         ;;
       a|A)
         clear
         cmd_attach
         echo ""
         read -p "Press Enter to continue..."
         ;;
       c|C)
         clear
         cmd_clean
         echo ""
         read -p "Press Enter to continue..."
         ;;
       r|R)
         # Just refresh (loop will redraw)
         ;;
       q|Q)
         clear
         echo "Goodbye!"
         return 1
         ;;
       *)
         # Unknown key, ignore
         ;;
     esac

     return 0
   }

   # Color helpers
   color_green() {
     echo -e "\033[32m$1\033[0m"
   }

   color_yellow() {
     echo -e "\033[33m$1\033[0m"
   }

   color_red() {
     echo -e "\033[31m$1\033[0m"
   }

   color_bold() {
     echo -e "\033[1m$1\033[0m"
   }
   ```

2. Add gum-enhanced TUI (optional):
   ```bash
   show_dashboard_gum() {
     if ! command -v gum &>/dev/null; then
       show_dashboard
       return
     fi

     # Use gum for styled output
     gum style --border normal --padding "1 2" --border-foreground 212 \
       "Code Squad - $repo_name"

     # Use gum table for sessions
     # ...
   }
   ```

3. Add keyboard handling:
   - Single keypress without Enter
   - Case-insensitive commands
   - Unknown keys are ignored

4. Add state refresh:
   - Re-read sessions on each loop
   - Re-read worktrees on each loop
   - Clear and redraw for clean display

5. Add graceful degradation:
   - Work without gum (basic terminal output)
   - Work without colors if not supported
   - Handle terminal resize (future)

## Test Scenarios

Link to main.md: TS15

### TDD Order

1. **TS15** (Main Dashboard Display):
   ```bash
   # Setup
   csq config init

   # Create test sessions
   add_session "id1" "feature-a" "worktree" "/path/a" "feature-a" "/path/a" "$$"
   create_lock "id1" "$$"  # Active

   add_session "id2" "feature-b" "local" "/path/b" "" "" "99999"
   # No lock = terminated

   # Create available worktree
   git worktree add ../test.worktree/feature-c -b feature-c

   # Execute (capture output)
   output=$(show_dashboard)

   # Assert
   [[ "$output" == *"Sessions:"* ]]
   [[ "$output" == *"feature-a"* ]]
   [[ "$output" == *"[*]"* ]]  # Active indicator
   [[ "$output" == *"feature-b"* ]]
   [[ "$output" == *"[-]"* ]]  # Terminated indicator
   [[ "$output" == *"Available Worktrees:"* ]]
   [[ "$output" == *"feature-c"* ]]
   [[ "$output" == *"[n] New session"* ]]
   [[ "$output" == *"[c] Clean"* ]]

   # Cleanup
   git worktree remove ../test.worktree/feature-c
   ```

### Manual Verification

```bash
# Run TUI
csq

# Expected display:
# ===================================
#   Code Squad - my-project
# ===================================
#
# Sessions:
#   [*] feature-a (wt)
#   [-] feature-b
#
#   Total: 2
#
# Available Worktrees:
#   - feature-c (feature-c)
#
# -----------------------------------
#   [n] New session
#   [a] Attach to worktree
#   [c] Clean terminated sessions
#   [r] Refresh
#   [q] Quit
# -----------------------------------

# Test interactions:
# Press 'n' -> Should go to new session flow
# Press 'a' -> Should go to attach flow
# Press 'c' -> Should go to clean flow
# Press 'r' -> Should refresh display
# Press 'q' -> Should exit
```

## Verification

- [ ] Dashboard shows on `csq` without args
- [ ] Repository name is displayed
- [ ] Active sessions shown with `[*]` indicator
- [ ] Terminated sessions shown with `[-]` indicator
- [ ] Worktree sessions labeled with `(wt)`
- [ ] Available worktrees section shows unattached worktrees
- [ ] `[n]` triggers new session flow
- [ ] `[a]` triggers attach flow
- [ ] `[c]` triggers clean flow
- [ ] `[r]` refreshes display
- [ ] `[q]` exits cleanly
- [ ] Works without gum installed
- [ ] Colors display correctly (or degrade gracefully)
- [ ] Config auto-init prompt works
