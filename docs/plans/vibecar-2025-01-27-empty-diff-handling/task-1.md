# Task 1: Add Gitignored File Fallback

## Goal

When git diff fails and untracked file check fails, read file directly to generate diff.

## File

`src/adapters/gateways/VscodeGitGateway.ts`

## Current Behavior

```typescript
getDiff() {
  1. Try git diff HEAD -- file
  2. If empty, check git ls-files --others --exclude-standard
  3. If untracked, cat file and generate fake diff
  4. Otherwise return ''
}
```

Problem: Step 2 won't find gitignored files (they're excluded by --exclude-standard).

## Implementation

Add final fallback after untracked check fails:

```typescript
// After untracked check returns empty...
// Final fallback: try reading file directly (for gitignored files)
exec(`cd "${workspaceRoot}" && cat "${relativePath}"`,
  { maxBuffer: 1024 * 1024 * 10 },
  (_catErr, fileContent) => {
    if (fileContent && fileContent.trim()) {
      const lines = fileContent.split('\n');
      const fakeDiff = lines.map((line) => `+${line}`).join('\n');
      resolve(`@@ -0,0 +1,${lines.length} @@ New file\n${fakeDiff}`);
    } else {
      resolve('');
    }
  }
);
```

## Acceptance Criteria

- [ ] Gitignored file selected in panel shows "new file" diff with all lines as additions
