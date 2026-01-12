# Task 3: Implement copyFile and ensureDir in VscodeFileSystemGateway

## Goal

Implement `copyFile()` and `ensureDir()` methods in VscodeFileSystemGateway using fs.promises.

## Files to Modify

- `src/adapters/outbound/gateways/VscodeFileSystemGateway.ts`

## Implementation

```typescript
async copyFile(source: string, dest: string): Promise<void> {
    await fs.promises.copyFile(source, dest);
}

async ensureDir(dirPath: string): Promise<void> {
    await fs.promises.mkdir(dirPath, { recursive: true });
}
```

## Test Scenarios

**Scenario 1: Copy file successfully**
- Given: Source file exists
- When: copyFile is called
- Then: File is copied to destination

**Scenario 2: Ensure directory creates nested dirs**
- Given: Parent directories don't exist
- When: ensureDir is called with nested path
- Then: All parent directories are created

## Acceptance Criteria

- [ ] `copyFile` copies file from source to destination
- [ ] `ensureDir` creates directory with `{ recursive: true }`
- [ ] Uses `fs.promises` for async operations
