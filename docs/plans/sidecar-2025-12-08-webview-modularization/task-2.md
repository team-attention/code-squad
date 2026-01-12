# Task 2: Build Configuration Update

**Status**: Ready
**Estimated Time**: 30 minutes
**Dependencies**: Task 1

## Objective

Update the esbuild configuration to bundle `main.ts` instead of `script.ts`, ensuring the new modular structure compiles correctly into a single webview bundle.

## Changes

### Files to Modify

1. `/package.json` - Update esbuild-webview script
2. `/src/adapters/inbound/ui/webview/index.ts` - Update imports

## Implementation Steps

### Step 1: Update index.ts to Export from main.ts

Modify `/src/adapters/inbound/ui/webview/index.ts`:

**Before:**
```typescript
export { getWebviewContent } from './template';
export { webviewStyles } from './styles';
export { webviewHtml } from './html';
export { webviewScript } from './script';
```

**After:**
```typescript
export { getWebviewContent } from './template';
export { webviewStyles } from './styles';
export { webviewHtml } from './html';
export { webviewScript } from './main';
```

**Reasoning**: This changes the export source from `script.ts` to `main.ts`. Since `main.ts` currently re-exports `webviewScript` from `script.ts`, functionality is preserved.

### Step 2: Verify Build Scripts

Check `package.json` to confirm esbuild configuration:

```json
{
  "scripts": {
    "esbuild-webview": "esbuild ./src/adapters/inbound/ui/webview/webview-entry.ts --bundle --outfile=dist/webview.js --format=iife --platform=browser --target=es2020"
  }
}
```

**Note**: The esbuild script points to `webview-entry.ts`, which is correct. The Shiki highlighter is bundled separately and loaded first. Our changes to `index.ts` will be picked up when `template.ts` imports from `index.ts`.

### Step 3: Verify Template.ts Integration

Check `/src/adapters/inbound/ui/webview/template.ts` to ensure it imports correctly:

```typescript
import { webviewStyles } from './styles';
import { webviewHtml } from './html';
import { webviewScript } from './script';  // This line imports from index.ts
```

The import statement `from './script'` is actually resolved by TypeScript/esbuild to `./index.ts`, which then exports from our updated source.

**Actually, looking at template.ts more carefully:**

The template.ts directly imports `{ webviewScript } from './script'`. We need to update this import as well.

### Step 2 (Revised): Update template.ts Import

Modify `/src/adapters/inbound/ui/webview/template.ts`:

**Before:**
```typescript
import { webviewStyles } from './styles';
import { webviewHtml } from './html';
import { webviewScript } from './script';
```

**After:**
```typescript
import { webviewStyles } from './styles';
import { webviewHtml } from './html';
import { webviewScript } from './main';
```

### Step 4: Test Build

```bash
npm run esbuild
```

Expected output:
- No errors
- `dist/extension.js` created
- `dist/webview.js` created

### Step 5: Verify Bundle Contents

```bash
# Check that main.ts code is included
grep -q "resetAbortController" dist/webview.js && echo "Bundle includes script code" || echo "ERROR: Script code not found"
```

The script code should be present because `main.ts` exports it from `script.ts`.

### Step 6: Test Extension Loading

1. Open VSCode with extension
2. Activate Sidecar panel
3. Verify webview loads
4. Check browser console for errors
5. Test basic functionality (click file, view diff)

## Test Scenarios

### Test 1: Clean Build

**Given**: Fresh project state
**When**: Run `npm run esbuild`
**Then**:
- Build completes in < 10 seconds
- No TypeScript compilation errors
- Both bundles created successfully
- Bundle sizes similar to before (±5%)

### Test 2: Development Build

**Given**: Updated build configuration
**When**: Run `npm run esbuild` (with sourcemaps)
**Then**:
- Sourcemaps generated correctly
- Can debug TypeScript in browser DevTools
- Source paths map to correct files

### Test 3: Production Build

**Given**: Updated build configuration
**When**: Run `npm run vscode:prepublish`
**Then**:
- Minified bundles created
- No errors during minification
- Bundle sizes acceptable (< 500KB for webview.js)

### Test 4: Module Resolution

**Given**: main.ts imports from state/
**When**: Build runs
**Then**:
- All imports resolve correctly
- No "module not found" errors
- StateManager code included in bundle

### Test 5: Runtime Loading

**Given**: Extension installed in VSCode
**When**: Open Sidecar panel
**Then**:
- Webview HTML loads
- JavaScript executes without errors
- All existing functionality works

## Acceptance Criteria

- ✅ `index.ts` exports from `main.ts` instead of `script.ts`
- ✅ `template.ts` imports from `main.ts` instead of `script.ts`
- ✅ Clean build completes successfully
- ✅ Both development and production builds work
- ✅ Bundle size not significantly increased
- ✅ Extension loads and functions identically to before
- ✅ No console errors or warnings
- ✅ Sourcemaps work for debugging

## Rollback

If build issues occur:

1. Revert `index.ts`:
```typescript
export { webviewScript } from './script';
```

2. Revert `template.ts`:
```typescript
import { webviewScript } from './script';
```

3. Rebuild:
```bash
npm run esbuild
```

## Notes

- This change is transparent to the extension host - only internal bundling changes
- `webview-entry.ts` remains unchanged (Shiki highlighter setup)
- The VSCode webview still receives the same bundled script
- No changes to message passing or external APIs
- Build time should remain similar (no performance degradation)

## Verification Commands

```bash
# Build
npm run esbuild

# Check bundle created
ls -lh dist/webview.js

# Check for errors in build output
npm run esbuild 2>&1 | grep -i error

# Verify TypeScript compilation
npm run compile

# Run linter
npm run lint
```
