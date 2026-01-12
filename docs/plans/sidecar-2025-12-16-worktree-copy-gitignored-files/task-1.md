# Task 1: Add configuration to package.json

## Goal

Add `codeSquad.worktreeCopyPatterns` configuration property to package.json.

## Files to Modify

- `package.json`

## Implementation

Add new property under `contributes.configuration.properties`:

```json
"codeSquad.worktreeCopyPatterns": {
  "type": "array",
  "default": [],
  "scope": "machine-overridable",
  "items": {
    "type": "string"
  },
  "description": "Glob patterns for files to copy from main workspace to worktrees (e.g., ['.env*', 'config/**'])"
}
```

## Acceptance Criteria

- [ ] Configuration property defined in package.json
- [ ] Default value is empty array `[]`
- [ ] Scope is `machine-overridable` (user + workspace level)
- [ ] Description explains the purpose with examples
