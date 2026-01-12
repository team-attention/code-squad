# Task 1: Add getUncommittedFiles to Git Port

## Goal

Add a method to retrieve all uncommitted files from git for baseline capture.

## Files to Modify

1. `src/application/ports/outbound/IGitPort.ts`
2. `src/adapters/outbound/gateways/VscodeGitGateway.ts`

## Implementation

### 1. IGitPort.ts

Add new method to interface:

```typescript
export interface IGitPort {
    getDiff(workspaceRoot: string, relativePath: string): Promise<string>;
    isGitRepository(workspaceRoot: string): Promise<boolean>;
    getUncommittedFiles(workspaceRoot: string): Promise<string[]>; // NEW
}
```

### 2. VscodeGitGateway.ts

Implement the method using `git status --porcelain`:

```typescript
async getUncommittedFiles(workspaceRoot: string): Promise<string[]> {
    const isGit = await this.isGitRepository(workspaceRoot);
    if (!isGit) return [];

    return new Promise((resolve) => {
        exec(
            `cd "${workspaceRoot}" && git status --porcelain`,
            { maxBuffer: 1024 * 1024 },
            (error, stdout) => {
                if (error) {
                    resolve([]);
                    return;
                }

                const files = stdout
                    .split('\n')
                    .filter(line => line.trim())
                    .map(line => line.substring(3).trim()) // Remove status prefix (e.g., "M ", "?? ")
                    .filter(file => file.length > 0);

                resolve(files);
            }
        );
    });
}
```

## Git Status Output Format

```
 M modified-file.ts      # Modified (staged or unstaged)
?? untracked-file.ts     # Untracked
A  added-file.ts         # Added to staging
D  deleted-file.ts       # Deleted
```

The method returns relative paths without the status prefix.

## Validation

- [ ] `IGitPort` interface updated with `getUncommittedFiles`
- [ ] `VscodeGitGateway` implements the new method
- [ ] Returns empty array for non-git directories
- [ ] Returns relative paths for all uncommitted files
