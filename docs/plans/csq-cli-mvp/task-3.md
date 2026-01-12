# Task 3: Session Utilities

## Goal

Implement session CRUD operations and lock file management for tracking active/terminated sessions.

## Layer

Infrastructure

## Files

- `packages/cli/lib/utils/session.sh` - Session CRUD and lock management

## Implementation Steps

1. Create `lib/utils/session.sh`:
   ```bash
   # Constants
   SESSIONS_FILE=".code-squad/sessions.json"
   LOCKS_DIR=".code-squad/locks"

   # Generate UUID
   generate_uuid() {
     # Use /dev/urandom or uuidgen if available
     if command -v uuidgen &>/dev/null; then
       uuidgen | tr '[:upper:]' '[:lower:]'
     else
       cat /dev/urandom | LC_ALL=C tr -dc 'a-f0-9' | fold -w 32 | head -n 1 | \
         sed 's/\(.\{8\}\)\(.\{4\}\)\(.\{4\}\)\(.\{4\}\)\(.\{12\}\)/\1-\2-\3-\4-\5/'
     fi
   }

   # Get session status from lock file
   # Returns: "active" | "terminated"
   get_session_status() {
     local session_id="$1"
     local lock_file="$LOCKS_DIR/$session_id.lock"

     if [ ! -f "$lock_file" ]; then
       echo "terminated"
       return
     fi

     local pid
     pid=$(cat "$lock_file")

     if kill -0 "$pid" 2>/dev/null; then
       echo "active"
     else
       echo "terminated"
     fi
   }

   # Create lock file for session
   create_lock() {
     local session_id="$1"
     local pid="$2"
     mkdir -p "$LOCKS_DIR"
     echo "$pid" > "$LOCKS_DIR/$session_id.lock"
   }

   # Remove lock file
   remove_lock() {
     local session_id="$1"
     rm -f "$LOCKS_DIR/$session_id.lock"
   }

   # List all sessions with status
   list_sessions() {
     local sessions_file
     sessions_file=$(get_sessions_path)

     if [ ! -f "$sessions_file" ]; then
       echo "[]"
       return
     fi

     # Use jq if available, otherwise basic parsing
     if command -v jq &>/dev/null; then
       jq -r '.sessions[]' "$sessions_file"
     else
       # Basic JSON parsing with grep/sed
       ...
     fi
   }

   # Add session to sessions.json
   add_session() {
     local id="$1"
     local name="$2"
     local mode="$3"
     local working_dir="$4"
     local branch="${5:-}"
     local worktree_path="${6:-}"
     local pid="$7"

     local created_at
     created_at=$(date +%s)000  # Milliseconds

     local session_json
     session_json=$(cat <<EOF
   {
     "id": "$id",
     "name": "$name",
     "mode": "$mode",
     "workingDir": "$working_dir",
     "branch": "$branch",
     "worktreePath": "$worktree_path",
     "createdAt": $created_at,
     "pid": $pid
   }
   EOF
   )

     local sessions_file
     sessions_file=$(get_sessions_path)

     if command -v jq &>/dev/null; then
       local temp_file
       temp_file=$(mktemp)
       jq ".sessions += [$session_json]" "$sessions_file" > "$temp_file"
       mv "$temp_file" "$sessions_file"
     else
       # Fallback: manual JSON manipulation
       ...
     fi
   }

   # Remove session from sessions.json
   remove_session() {
     local session_id="$1"

     if command -v jq &>/dev/null; then
       local sessions_file
       sessions_file=$(get_sessions_path)
       local temp_file
       temp_file=$(mktemp)
       jq ".sessions = [.sessions[] | select(.id != \"$session_id\")]" "$sessions_file" > "$temp_file"
       mv "$temp_file" "$sessions_file"
     else
       # Fallback
       ...
     fi

     remove_lock "$session_id"
   }

   # Get session by ID
   get_session() {
     local session_id="$1"
     # Return session JSON object
   }

   # Get sessions by status
   get_sessions_by_status() {
     local status="$1"  # "active" | "terminated"
     # Filter sessions by checking lock status
   }
   ```

2. Add JSON manipulation helpers:
   - Prefer `jq` when available for robust parsing
   - Fallback to grep/sed for basic operations
   - Handle edge cases (empty file, malformed JSON)

3. Add path resolution helpers:
   - `get_sessions_path()` - Resolve to repo root
   - `get_locks_dir()` - Resolve to repo root

4. Implement session lifecycle functions:
   - `create_session()` - Wrapper that generates UUID, creates lock, adds to JSON
   - `terminate_session()` - Clean up lock file, update JSON
   - `get_all_sessions_with_status()` - List with current status

## Test Scenarios

No direct test scenarios - this is utility code used by commands.

### Unit Test Cases (for bats)

```bash
@test "generate_uuid returns valid UUID format" {
  run generate_uuid
  [[ "$output" =~ ^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$ ]]
}

@test "get_session_status returns active for running PID" {
  local test_id="test-session"
  echo "$$" > "$LOCKS_DIR/$test_id.lock"
  run get_session_status "$test_id"
  [ "$output" = "active" ]
}

@test "get_session_status returns terminated for dead PID" {
  local test_id="test-session"
  echo "99999" > "$LOCKS_DIR/$test_id.lock"  # Likely dead PID
  run get_session_status "$test_id"
  [ "$output" = "terminated" ]
}

@test "get_session_status returns terminated for missing lock" {
  run get_session_status "nonexistent"
  [ "$output" = "terminated" ]
}
```

### Manual Verification

```bash
# Create test session
source lib/utils/session.sh
add_session "test-id" "test-name" "local" "/tmp" "" "" "$$"
cat .code-squad/sessions.json

# Check status
get_session_status "test-id"  # Should be "active"

# Remove
remove_session "test-id"
cat .code-squad/sessions.json
```

## Verification

- [ ] UUID generation works (format validation)
- [ ] Lock file creation/removal works
- [ ] Session status detection is accurate
- [ ] add_session correctly appends to JSON
- [ ] remove_session correctly removes from JSON
- [ ] Works with and without jq installed
