# Task 1: Install and Configure Shiki

**Layer**: Infrastructure
**Dependencies**: None

## Goal

Add Shiki as a project dependency and configure the build system to bundle it correctly for the webview.

## Files to Modify

| File | Changes |
|------|---------|
| `package.json` | Add shiki dependency |
| `esbuild.js` | Configure webview bundling for Shiki |
| `src/adapters/inbound/ui/SidecarPanelAdapter.ts` | Update CSP if needed |

## Implementation Steps

### Step 1: Install Shiki

```bash
npm install shiki
```

### Step 2: Update package.json

Verify shiki is added to dependencies (not devDependencies):

```json
{
  "dependencies": {
    "shiki": "^3.x.x"
  }
}
```

### Step 3: Configure esbuild for Webview

The webview script needs Shiki bundled. Check `esbuild.js` for webview build configuration:

- Ensure Shiki is bundled into the webview script
- Use the JavaScript RegExp engine (not WASM) to avoid CSP issues
- Mark external modules that shouldn't be bundled

### Step 4: Update Content Security Policy (if needed)

In `SidecarPanelAdapter.ts`, ensure the CSP allows the Shiki bundle:

```typescript
// If using WASM (not recommended), need 'wasm-unsafe-eval'
// With JS RegExp engine, standard CSP should work
```

## Validation

```bash
npm install                    # Install dependency
npm run compile                # Build succeeds
# Check that shiki is in node_modules
ls node_modules/shiki
```

## Architecture Compliance

- Infrastructure change: Package management
- No domain/application layer changes
- Build configuration only
