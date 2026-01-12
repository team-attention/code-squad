# Implementation Plan: Empty Diff Handling

**Spec**: `docs/specs/vibecar-2025-01-27-empty-diff-handling.md`
**Size**: SMALL
**Total Tasks**: 4

## Summary

Handle two edge cases where files appear in Changed Files list but show empty diff:
1. Gitignored files added via whitelist
2. Files with changes reverted

## Tasks

| Task | Description | Files |
|------|-------------|-------|
| [task-1](./task-1.md) | Add gitignored file fallback in VscodeGitGateway | `VscodeGitGateway.ts` |
| [task-2](./task-2.md) | Add removeFile() to IPanelPort interface | `IPanelPort.ts` |
| [task-3](./task-3.md) | Implement removeFile() in SidecarPanelAdapter | `SidecarPanelAdapter.ts` |
| [task-4](./task-4.md) | Call removeFile() on empty diff in GenerateDiffUseCase | `GenerateDiffUseCase.ts` |

## Dependencies

```
task-1 (independent)
task-2 → task-3 → task-4
```

## Architecture

- **Domain**: No changes
- **Application**: `IPanelPort` interface extended, `GenerateDiffUseCase` modified
- **Adapters**: `VscodeGitGateway` fallback added, `SidecarPanelAdapter` implements new method
