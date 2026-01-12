# Task 1: Add package.json Configuration

## Goal

Add the `sidecar.fileWatchDebounceMs` configuration option to VSCode settings.

## Files to Modify

- `package.json`

## Implementation

Add to `contributes.configuration.properties` section:

```json
"sidecar.fileWatchDebounceMs": {
  "type": "number",
  "default": 300,
  "minimum": 0,
  "maximum": 2000,
  "description": "Debounce delay for file change events in milliseconds. Set to 0 to disable debouncing. (Default: 300ms)"
}
```

## Location

Find the existing Sidecar settings (`sidecar.autoDetect`, `sidecar.autoShowPanel`, `sidecar.includeFiles`) and add the new setting alongside them.

## Acceptance Criteria

- [ ] Setting appears in VSCode Settings UI under "Sidecar"
- [ ] Default value is 300
- [ ] Minimum value is 0 (disables debouncing)
- [ ] Maximum value is 2000
- [ ] Description explains the setting's purpose
