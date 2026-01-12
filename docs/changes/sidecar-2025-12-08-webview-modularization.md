# Changes: Webview Code Modularization

**Slug**: `sidecar-2025-12-08-webview-modularization`
**Date**: 2025-12-08
**Status**: Partial Implementation (Tasks 1-6 of 16)

## Summary

Implemented the infrastructure foundation for modularizing the monolithic `script.ts` (2,896 lines) into a modular architecture. Created directory structure, state management, utility modules, and three component modules.

## Completed Tasks

### Task 1: Infrastructure Setup
- Created directory structure:
  - `src/adapters/inbound/ui/webview/state/`
  - `src/adapters/inbound/ui/webview/utils/`
  - `src/adapters/inbound/ui/webview/components/{sidebar,diff,waiting}/`
- Created StateManager with centralized state types
- Created `main.ts` entry point (re-exports from script.ts for now)
- Updated tsconfig.json to exclude new modules from tsc (handled by esbuild)

### Task 2: Build Configuration
- Updated `template.ts` to import from `main.ts` instead of `script.ts`
- Updated `index.ts` exports
- Verified build works correctly

### Task 3: Extract Utilities
- Created `utils/dom.ts`: escapeHtml, getElementById, querySelector, querySelectorAll
- Created `utils/events.ts`: resetAbortController, getSignal, abortAllListeners
- Created `utils/scroll.ts`: getScrollableElement, saveCurrentScrollPosition, restoreScrollPosition
- Created `utils/collections.ts`: SizeLimitedSet, SizeLimitedMap

### Task 4: Extract HNFeed Component
- Created `components/waiting/HNFeed.ts`
- Includes renderHNFeed, setupHNFeedHandlers
- Exports HNStory and HNFeedStatus types

### Task 5: Extract WaitingScreen Component
- Created `components/waiting/WaitingScreen.ts`
- Includes renderWaitingScreen, showWaitingScreen
- Depends on HNFeed component

### Task 6: Extract AIStatus Component
- Created `components/sidebar/AIStatus.ts`
- Includes renderAIStatus
- Exports AIStatusData type

## Files Created

```
src/adapters/inbound/ui/webview/
├── main.ts
├── state/
│   ├── index.ts
│   ├── types.ts
│   └── StateManager.ts
├── utils/
│   ├── index.ts
│   ├── dom.ts
│   ├── events.ts
│   ├── scroll.ts
│   └── collections.ts
└── components/
    ├── index.ts
    ├── sidebar/
    │   └── AIStatus.ts
    └── waiting/
        ├── HNFeed.ts
        └── WaitingScreen.ts
```

## Files Modified

- `tsconfig.json`: Added exclusions for new webview modules
- `src/adapters/inbound/ui/webview/template.ts`: Import from main.ts
- `src/adapters/inbound/ui/webview/index.ts`: Export from main.ts

## Architecture Note

The original `script.ts` is a **string template** (entire content wrapped in backticks), not actual TypeScript. The extracted modules are real TypeScript that will be integrated when the architecture transitions from string template to bundled modules.

Currently:
- `script.ts` remains the working code (string template)
- New modules are ready for use but not yet integrated
- Full integration requires Tasks 7-16

## Remaining Tasks (7-16)

- Task 7: Extract DiffSearch
- Task 8: Extract Comments
- Task 9: Extract FileList
- Task 10: Extract MarkdownPreview
- Task 11: Extract ScopedDiff
- Task 12: Extract InlineComments
- Task 13: Extract DiffViewer
- Task 14: Migrate State (use StateManager)
- Task 15: Integrate Main (replace script.ts with bundled modules)
- Task 16: Cleanup & Optimization

## Verification

```bash
npm run compile  # TypeScript compilation passes
npm run esbuild  # Build succeeds, bundle sizes unchanged
```

## Bundle Sizes (Unchanged)

- `dist/extension.js`: 458.6kb
- `dist/webview.js`: 999.6kb (Shiki highlighter)

## Review

### Evaluation
- ✅ Spec compliance (partial - Tasks 1-6 completed as planned)
- ✅ Architecture compliance (follows modular structure from spec)
- ✅ TypeScript compilation passes
- ✅ Build succeeds (esbuild bundles correctly)
- ⚠️ Lint skipped (ESLint config missing - pre-existing issue)
- ⚠️ Tests skipped (blocked by lint pre-test)

### User Feedback
- Evaluation: Good
- User approved the partial implementation approach

### Feedback
- What went well:
  - Clean separation of infrastructure, utilities, and components
  - Build system works without changes to esbuild config
  - Progressive migration approach (re-export from main.ts) avoids breaking changes
- What could be improved:
  - ESLint configuration needs to be restored for project (separate issue)
  - Components are created but not yet integrated - requires remaining tasks

### Friction
- None discovered during review

### Next Actions
- Continue with Tasks 7-16 to complete the modularization
- Consider fixing ESLint configuration as a separate task
