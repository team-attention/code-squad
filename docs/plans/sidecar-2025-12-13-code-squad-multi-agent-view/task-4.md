# Task 4: Register TreeView in package.json

## Overview

**Layer**: Configuration
**Dependencies**: Task 3
**Complexity**: Low

## Goal

Register the TreeView, Activity Bar container, and commands in package.json.

## Files to Modify

| File | Changes |
|------|---------|
| `package.json` | Add viewsContainers, views, commands |

## Implementation Details

### Add to package.json contributes section

```json
{
  "contributes": {
    "viewsContainers": {
      "activitybar": [
        {
          "id": "sidecar",
          "title": "Sidecar",
          "icon": "$(hubot)"
        }
      ]
    },
    "views": {
      "sidecar": [
        {
          "id": "sidecarThreadList",
          "name": "Threads",
          "icon": "$(list-tree)",
          "contextualTitle": "Sidecar Threads"
        }
      ]
    },
    "commands": [
      {
        "command": "sidecar.selectThread",
        "title": "Sidecar: Select Thread"
      },
      {
        "command": "sidecar.cycleThreads",
        "title": "Sidecar: Cycle Through Threads"
      }
    ],
    "keybindings": [
      {
        "command": "sidecar.cycleThreads",
        "key": "ctrl+shift+a",
        "mac": "cmd+shift+a",
        "when": "sidecar.hasMultipleThreads"
      }
    ]
  }
}
```

### Notes

1. **Activity Bar Icon**: Using built-in `$(hubot)` icon. Can be replaced with custom SVG in `assets/sidecar-icon.svg` if desired.

2. **View ID**: `sidecarThreadList` must match the ID used in `ThreadListController.activate()`.

3. **Keybinding Condition**: `sidecar.hasMultipleThreads` context key is set by ThreadListController when sessions.size > 1.

4. **Existing Commands**: Ensure new commands don't conflict with existing commands in package.json.

## Test Scenarios

### TS-4.1: Activity Bar Icon

**Given**: Extension is loaded
**When**: Viewing Activity Bar
**Then**: Sidecar icon (hubot) appears in Activity Bar

### TS-4.2: View Registration

**Given**: Sidecar Activity Bar item is clicked
**When**: Panel opens
**Then**: "Threads" view header is visible

### TS-4.3: Command Registration

**Given**: Command palette opened (Cmd+Shift+P)
**When**: Typing "Sidecar: Select"
**Then**: "Sidecar: Select Thread" command appears

### TS-4.4: Keybinding Active

**Given**: 2+ agent sessions active (sidecar.hasMultipleThreads = true)
**When**: Cmd+Shift+A is pressed
**Then**: cycleThreads command is invoked

### TS-4.5: Keybinding Inactive

**Given**: Only 1 agent session active (sidecar.hasMultipleThreads = false)
**When**: Cmd+Shift+A is pressed
**Then**: No action (keybinding condition not met)

## Acceptance Criteria

- [ ] viewsContainers.activitybar includes sidecar container
- [ ] views.sidecar includes sidecarThreadList view
- [ ] commands includes selectThread and cycleThreads
- [ ] keybindings includes cycleThreads with condition
- [ ] Activity Bar shows Sidecar icon after extension load
- [ ] Threads view appears when Sidecar container selected
- [ ] `npm run compile` succeeds
- [ ] Extension activates without errors
