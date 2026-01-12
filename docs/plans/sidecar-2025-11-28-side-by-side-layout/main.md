# Implementation Plan: Side-by-Side Layout

**Slug**: `sidecar-2025-11-28-side-by-side-layout`
**Spec**: `docs/specs/sidecar-2025-11-28-side-by-side-layout.md`
**Size**: TINY
**Total Tasks**: 1
**Estimated Files**: 1

## Summary

Remove the `moveEditorToRightGroup` command that pushes the AI terminal to the right editor group, causing it to become a tab alongside Sidecar instead of appearing side-by-side.

## Architecture Impact

| Layer | Impact |
|-------|--------|
| Domain | None |
| Application | None |
| Adapters | 1 line removal in `AIDetectionController.ts` |
| Infrastructure | None |

## Task List

| Task | Description | Files | Status |
|------|-------------|-------|--------|
| [task-1](./task-1.md) | Remove moveEditorToRightGroup command | 1 | Pending |

## Dependencies

```
task-1 (no dependencies)
```

## Validation Checklist

- [ ] `npm run compile` passes
- [ ] `npm run lint` passes
- [ ] Manual test: VSCode side-by-side layout works
- [ ] Manual test: Cursor graceful fallback works
