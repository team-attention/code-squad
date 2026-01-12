# Task 4: Worktree Utilities

## Goal

Implement git worktree operations: list, create, validate, and remove.

## Layer

Infrastructure

## Files

- `packages/cli/lib/utils/worktree.sh` - Git worktree utilities

## Implementation Steps

1. Create `lib/utils/worktree.sh`:
   ```bash
   # List all worktrees (excluding main repo)
   # Output format: path|branch|head (pipe-separated for easy parsing)
   list_worktrees() {
     local repo_root
     repo_root=$(git rev-parse --show-toplevel)

     git worktree list --porcelain | awk '
       /^worktree / { path = substr($0, 10) }
       /^branch / { branch = substr($0, 8); gsub("refs/heads/", "", branch) }
       /^HEAD / { head = substr($0, 6) }
       /^$/ {
         if (path != repo_root) {
           print path "|" branch "|" head
         }
         path = ""; branch = ""; head = ""
       }
     ' repo_root="$repo_root"
   }

   # Get worktrees not attached to any session
   get_available_worktrees() {
     local attached_paths
     attached_paths=$(get_attached_worktree_paths)

     list_worktrees | while IFS='|' read -r path branch head; do
       if ! echo "$attached_paths" | grep -qF "$path"; then
         echo "$path|$branch|$head"
       fi
     done
   }

   # Create new worktree
   # Arguments: worktree_path, branch_name
   create_worktree() {
     local worktree_path="$1"
     local branch_name="$2"
     local repo_root
     repo_root=$(git rev-parse --show-toplevel)

     # Ensure parent directory exists
     mkdir -p "$(dirname "$worktree_path")"

     # Create worktree with new branch
     git -C "$repo_root" worktree add "$worktree_path" -b "$branch_name"
   }

   # Validate worktree exists and is valid
   is_valid_worktree() {
     local path="$1"

     # Check directory exists
     [ -d "$path" ] || return 1

     # Check it's a git worktree
     git -C "$path" rev-parse --is-inside-work-tree &>/dev/null || return 1

     # Check it's in the worktree list
     list_worktrees | grep -qF "$path"
   }

   # Get branch name for worktree
   get_worktree_branch() {
     local worktree_path="$1"
     git -C "$worktree_path" rev-parse --abbrev-ref HEAD
   }

   # Remove worktree
   # Arguments: worktree_path, force (optional)
   remove_worktree() {
     local worktree_path="$1"
     local force="${2:-false}"
     local repo_root
     repo_root=$(git rev-parse --show-toplevel)

     if [ "$force" = "true" ]; then
       git -C "$repo_root" worktree remove --force "$worktree_path"
     else
       git -C "$repo_root" worktree remove "$worktree_path"
     fi
   }

   # Check for uncommitted changes in worktree
   has_uncommitted_changes() {
     local worktree_path="$1"
     ! git -C "$worktree_path" diff --quiet HEAD 2>/dev/null || \
     ! git -C "$worktree_path" diff --cached --quiet HEAD 2>/dev/null
   }

   # Copy files matching patterns to worktree
   # Arguments: source_root, dest_root, patterns (newline-separated)
   copy_worktree_files() {
     local source_root="$1"
     local dest_root="$2"
     local patterns="$3"

     echo "$patterns" | while read -r pattern; do
       [ -z "$pattern" ] && continue

       # Use find or glob to match pattern
       local matched_files
       matched_files=$(cd "$source_root" && find . -path "./$pattern" -o -name "$pattern" 2>/dev/null)

       echo "$matched_files" | while read -r file; do
         [ -z "$file" ] && continue
         local rel_path="${file#./}"
         local src="$source_root/$rel_path"
         local dst="$dest_root/$rel_path"

         if [ -e "$src" ]; then
           mkdir -p "$(dirname "$dst")"
           cp -r "$src" "$dst"
           echo "Copied: $rel_path"
         fi
       done
     done
   }

   # Get resolved worktree path for new session
   get_new_worktree_path() {
     local session_name="$1"
     local base_path
     base_path=$(get_worktree_base_path)  # From config.sh
     local repo_root
     repo_root=$(git rev-parse --show-toplevel)

     # Resolve relative path to absolute
     if [[ "$base_path" == /* ]]; then
       echo "$base_path/$session_name"
     else
       echo "$(dirname "$repo_root")/${base_path#../}/$session_name"
     fi
   }
   ```

2. Add error handling:
   - Check git availability
   - Handle worktree creation conflicts (branch exists, path exists)
   - Handle removal of worktrees with uncommitted changes

3. Add helper for pattern-based file copying:
   - Parse `copyPatterns` from config
   - Support glob patterns (`*.env`, `node_modules/**`)
   - Preserve directory structure

## Test Scenarios

No direct test scenarios - this is utility code used by commands.

### Unit Test Cases (for bats)

```bash
@test "list_worktrees excludes main repo" {
  # Setup: create a worktree
  git worktree add ../test-worktree -b test-branch

  run list_worktrees
  [ "$status" -eq 0 ]
  [[ "$output" == *"test-worktree"* ]]
  [[ "$output" != *"$(git rev-parse --show-toplevel)"* ]]

  # Cleanup
  git worktree remove ../test-worktree
}

@test "create_worktree creates new worktree" {
  run create_worktree "../new-worktree" "new-branch"
  [ "$status" -eq 0 ]
  [ -d "../new-worktree" ]

  # Cleanup
  git worktree remove "../new-worktree"
  git branch -D "new-branch"
}

@test "has_uncommitted_changes detects dirty state" {
  git worktree add ../dirty-worktree -b dirty-branch
  echo "change" > ../dirty-worktree/test.txt

  run has_uncommitted_changes "../dirty-worktree"
  [ "$status" -eq 0 ]

  # Cleanup
  git worktree remove --force ../dirty-worktree
  git branch -D dirty-branch
}
```

### Manual Verification

```bash
# List worktrees
source lib/utils/worktree.sh
list_worktrees

# Create worktree
create_worktree "../test.worktree/feature-x" "feature-x"
ls ../test.worktree/

# Copy files
copy_worktree_files "$(pwd)" "../test.worktree/feature-x" "node_modules
.env*"

# Check uncommitted
has_uncommitted_changes "../test.worktree/feature-x" && echo "dirty" || echo "clean"

# Cleanup
remove_worktree "../test.worktree/feature-x"
```

## Verification

- [ ] `list_worktrees` returns correct format
- [ ] `list_worktrees` excludes main repo
- [ ] `create_worktree` creates worktree and branch
- [ ] `is_valid_worktree` correctly validates paths
- [ ] `remove_worktree` handles force flag
- [ ] `has_uncommitted_changes` detects dirty state
- [ ] `copy_worktree_files` copies matching patterns
