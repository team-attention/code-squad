# Task 5: Terminal Opener Utilities

## Goal

Implement terminal opening functionality for different terminal applications (native, iTerm, tmux).

## Layer

Infrastructure

## Files

- `packages/cli/lib/utils/terminal.sh` - Terminal opener utilities

## Implementation Steps

1. Create `lib/utils/terminal.sh`:
   ```bash
   # Get terminal opener from config (default: native)
   get_terminal_opener() {
     local opener
     opener=$(config_get "terminal.opener")
     echo "${opener:-native}"
   }

   # Get init command from config
   get_init_command() {
     config_get "terminal.initCommand"
   }

   # Open terminal in directory
   # Arguments: working_dir, session_name
   # Returns: PID of the terminal process
   open_terminal() {
     local working_dir="$1"
     local session_name="$2"
     local opener
     opener=$(get_terminal_opener)

     case "$opener" in
       native)
         open_native_terminal "$working_dir" "$session_name"
         ;;
       iterm)
         open_iterm_terminal "$working_dir" "$session_name"
         ;;
       tmux)
         open_tmux_terminal "$working_dir" "$session_name"
         ;;
       *)
         echo "Unknown terminal opener: $opener" >&2
         return 1
         ;;
     esac
   }

   # Native terminal (macOS Terminal.app)
   open_native_terminal() {
     local working_dir="$1"
     local session_name="$2"
     local init_cmd
     init_cmd=$(get_init_command)

     if [ -n "$init_cmd" ]; then
       osascript <<EOF
   tell application "Terminal"
     activate
     do script "cd '$working_dir' && $init_cmd"
     set custom title of front window to "$session_name"
   end tell
   EOF
     else
       osascript <<EOF
   tell application "Terminal"
     activate
     do script "cd '$working_dir'"
     set custom title of front window to "$session_name"
   end tell
   EOF
     fi

     # Get PID of Terminal process
     pgrep -n Terminal
   }

   # iTerm2 terminal
   open_iterm_terminal() {
     local working_dir="$1"
     local session_name="$2"
     local init_cmd
     init_cmd=$(get_init_command)

     if [ -n "$init_cmd" ]; then
       osascript <<EOF
   tell application "iTerm"
     activate
     tell current window
       create tab with default profile
       tell current session
         write text "cd '$working_dir' && $init_cmd"
         set name to "$session_name"
       end tell
     end tell
   end tell
   EOF
     else
       osascript <<EOF
   tell application "iTerm"
     activate
     tell current window
       create tab with default profile
       tell current session
         write text "cd '$working_dir'"
         set name to "$session_name"
       end tell
     end tell
   end tell
   EOF
     fi

     # Get PID of iTerm process
     pgrep -n iTerm2
   }

   # tmux session
   open_tmux_terminal() {
     local working_dir="$1"
     local session_name="$2"
     local init_cmd
     init_cmd=$(get_init_command)

     # Clean session name for tmux (no dots, etc.)
     local tmux_session_name
     tmux_session_name=$(echo "$session_name" | tr '.' '_')

     if [ -n "$init_cmd" ]; then
       tmux new-session -d -s "$tmux_session_name" -c "$working_dir" "$init_cmd; $SHELL"
     else
       tmux new-session -d -s "$tmux_session_name" -c "$working_dir"
     fi

     # Attach to session (or show message)
     echo "Created tmux session: $tmux_session_name"
     echo "Attach with: tmux attach -t $tmux_session_name"

     # Get PID of tmux server
     pgrep -n tmux
   }

   # Check if terminal opener is available
   check_terminal_available() {
     local opener
     opener=$(get_terminal_opener)

     case "$opener" in
       native)
         [ -d "/Applications/Utilities/Terminal.app" ] || \
           [ -d "/System/Applications/Utilities/Terminal.app" ]
         ;;
       iterm)
         [ -d "/Applications/iTerm.app" ]
         ;;
       tmux)
         command -v tmux &>/dev/null
         ;;
       *)
         return 1
         ;;
     esac
   }

   # Get suggested PID for lock file
   # Note: This is an approximation - we track the terminal app PID
   # The actual shell PID in the terminal is different
   get_terminal_pid() {
     local opener
     opener=$(get_terminal_opener)

     case "$opener" in
       native)
         pgrep -n Terminal
         ;;
       iterm)
         pgrep -n iTerm2
         ;;
       tmux)
         pgrep -n tmux
         ;;
     esac
   }
   ```

2. Handle platform detection:
   - macOS: Support Terminal.app, iTerm2
   - Linux: Could add gnome-terminal, konsole later (out of MVP scope)
   - Fallback to $SHELL in current terminal if no GUI available

3. Add PID tracking considerations:
   - Terminal app PID vs shell PID distinction
   - For MVP, use terminal app PID as approximation
   - Consider using shell's `$$` when possible

4. Add init command execution:
   - Read from config
   - Execute after cd to working directory
   - Handle empty/missing init command

## Test Scenarios

Link to main.md: TS6 (partial)

### Manual Test Cases

```bash
# Test native terminal opener
source lib/utils/terminal.sh
open_native_terminal "/tmp" "test-session"
# Should open Terminal.app in /tmp

# Test iTerm opener
open_iterm_terminal "/tmp" "test-session"
# Should open new iTerm tab in /tmp

# Test tmux opener
open_tmux_terminal "/tmp" "test-session"
tmux list-sessions
# Should show test-session

# Test with init command
# Edit config.yml: terminal.initCommand: "echo hello"
open_terminal "/tmp" "test-with-init"
# Should see "hello" in the new terminal
```

### Platform Considerations

- This implementation is macOS-focused (osascript)
- Linux support would require different approach (not in MVP)

## Verification

- [ ] `open_native_terminal` opens Terminal.app
- [ ] `open_iterm_terminal` opens iTerm2 tab
- [ ] `open_tmux_terminal` creates tmux session
- [ ] Terminal opens in correct working directory
- [ ] Session name is set in terminal title
- [ ] Init command is executed if configured
- [ ] `check_terminal_available` correctly detects availability
- [ ] PID can be retrieved for lock file
