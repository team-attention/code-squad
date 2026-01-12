# Changes: Auto-copy Gitignored Files on Worktree Creation

## Summary

Implemented automatic copying of gitignored files (like `.env`, config files) from the main workspace to newly created worktrees based on user-defined glob patterns.

## Changes

### Configuration (package.json)
- Added `codeSquad.worktreeCopyPatterns` configuration property
  - Type: `string[]`
  - Default: `[]`
  - Scope: `machine-overridable` (user + workspace level)
  - Description: Glob patterns for files to copy from main workspace to worktrees

### Application Layer

**IFileSystemPort** (`src/application/ports/outbound/IFileSystemPort.ts`)
- Added `copyFile(source: string, dest: string): Promise<void>`
- Added `ensureDir(dirPath: string): Promise<void>`

**CreateThreadInput** (`src/application/ports/inbound/ICreateThreadUseCase.ts`)
- Added optional `worktreeCopyPatterns?: string[]` property

**CreateThreadUseCase** (`src/application/useCases/CreateThreadUseCase.ts`)
- Added `IFileSystemPort` and `IFileGlobber` as dependencies
- Added `copyWorktreeFiles()` method to glob and copy files after worktree creation
- Added `copySingleFile()` helper for individual file copies with error handling
- Copy failures are logged but don't block thread creation

### Adapters Layer

**VscodeFileSystemGateway** (`src/adapters/outbound/gateways/VscodeFileSystemGateway.ts`)
- Implemented `copyFile()` using `fs.promises.copyFile()`
- Implemented `ensureDir()` using `fs.promises.mkdir({ recursive: true })`

**ThreadListController** (`src/adapters/inbound/controllers/ThreadListController.ts`)
- Added `getWorktreeCopyPatterns()` helper to read configuration
- Updated `createThread()` and `createThreadFromInput()` to pass patterns to use case

### Infrastructure Layer

**extension.ts** (`src/extension.ts`)
- Updated `CreateThreadUseCase` instantiation to inject `fileSystemGateway` and `fileGlobber`

### Tests

**CreateThreadUseCase.test.ts** (new file)
- Added 8 unit tests covering:
  - TS1: Files copied matching patterns after worktree creation
  - TS2: No copy when patterns empty
  - TS3: No error when pattern matches no files
  - TS4: Continues copying after individual file failure
  - TS5: No copy when not worktree mode
  - TS6: Directory structure preserved
  - Basic thread creation in non-worktree mode
  - Worktree and terminal creation in worktree mode

**Existing test files** (MockFileSystemPort updates)
- `CaptureSnapshotsUseCase.test.ts` - Added `copyFile()`, `ensureDir()` stubs
- `GenerateDiffUseCase.test.ts` - Added `copyFile()`, `ensureDir()` stubs
- `GenerateScopedDiffUseCase.test.ts` - Added `copyFile()`, `ensureDir()` stubs

## Validation

- `npm run compile` - Pass
- `npm run lint` - Pass (0 errors, pre-existing warnings only)
- `npm run test:unit` - CreateThreadUseCase tests pass (8/8)

## Files Changed

| File | Change |
|------|--------|
| `package.json` | Added configuration property |
| `src/application/ports/outbound/IFileSystemPort.ts` | Added 2 methods |
| `src/application/ports/inbound/ICreateThreadUseCase.ts` | Added property |
| `src/application/useCases/CreateThreadUseCase.ts` | Core implementation |
| `src/adapters/outbound/gateways/VscodeFileSystemGateway.ts` | Implemented methods |
| `src/adapters/inbound/controllers/ThreadListController.ts` | Config reading |
| `src/extension.ts` | DI wiring |
| `src/test/application/useCases/CreateThreadUseCase.test.ts` | New test file |
| `src/test/application/useCases/CaptureSnapshotsUseCase.test.ts` | Mock update |
| `src/test/application/useCases/GenerateDiffUseCase.test.ts` | Mock update |
| `src/test/application/useCases/GenerateScopedDiffUseCase.test.ts` | Mock update |
