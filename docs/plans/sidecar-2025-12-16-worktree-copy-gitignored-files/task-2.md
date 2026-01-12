# Task 2: Extend IFileSystemPort with copyFile and ensureDir

## Goal

Add `copyFile()` and `ensureDir()` methods to IFileSystemPort interface.

## Files to Modify

- `src/application/ports/outbound/IFileSystemPort.ts`

## Implementation

```typescript
export interface IFileSystemPort {
    readFile(absolutePath: string): Promise<string>;
    fileExists(absolutePath: string): Promise<boolean>;
    isFile(absolutePath: string): Promise<boolean>;
    getWorkspaceRoot(): string | undefined;
    toAbsolutePath(relativePath: string): string;
    toRelativePath(absolutePath: string): string;
    copyFile(source: string, dest: string): Promise<void>;  // NEW
    ensureDir(dirPath: string): Promise<void>;              // NEW
}
```

## Acceptance Criteria

- [ ] `copyFile(source: string, dest: string): Promise<void>` added
- [ ] `ensureDir(dirPath: string): Promise<void>` added
- [ ] No implementation details in interface
