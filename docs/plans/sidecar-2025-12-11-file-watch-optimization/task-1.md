# Task 1: Add Git Extension Types

## Goal

Create type definitions for the VSCode Git Extension API.

## Files to Create

- `src/types/git.d.ts`

## Implementation

Create TypeScript type definitions for the VSCode Git Extension API. These types are not shipped with `@types/vscode` but are needed to interact with the built-in git extension.

```typescript
// src/types/git.d.ts
import * as vscode from 'vscode';

/**
 * VSCode Git Extension API types
 * Based on: https://github.com/microsoft/vscode/blob/main/extensions/git/src/api/api1.ts
 */

export interface GitExtension {
  readonly enabled: boolean;
  getAPI(version: 1): GitAPI;
}

export interface GitAPI {
  readonly repositories: Repository[];
  readonly onDidOpenRepository: vscode.Event<Repository>;
  readonly onDidCloseRepository: vscode.Event<Repository>;
}

export interface Repository {
  readonly rootUri: vscode.Uri;
  readonly state: RepositoryState;
  readonly inputBox: InputBox;
}

export interface InputBox {
  value: string;
}

export interface RepositoryState {
  readonly HEAD: Branch | undefined;
  readonly refs: Ref[];
  readonly remotes: Remote[];
  readonly submodules: Submodule[];
  readonly rebaseCommit: Commit | undefined;
  readonly mergeChanges: Change[];
  readonly indexChanges: Change[];
  readonly workingTreeChanges: Change[];
  readonly onDidChange: vscode.Event<void>;
}

export interface Branch {
  readonly name: string | undefined;
  readonly commit: string | undefined;
  readonly upstream?: { name: string; remote: string };
}

export interface Ref {
  readonly type: RefType;
  readonly name?: string;
  readonly commit?: string;
  readonly remote?: string;
}

export enum RefType {
  Head,
  RemoteHead,
  Tag
}

export interface Remote {
  readonly name: string;
  readonly fetchUrl?: string;
  readonly pushUrl?: string;
  readonly isReadOnly: boolean;
}

export interface Submodule {
  readonly name: string;
  readonly path: string;
  readonly url: string;
}

export interface Commit {
  readonly hash: string;
  readonly message: string;
}

export interface Change {
  readonly uri: vscode.Uri;
  readonly originalUri: vscode.Uri;
  readonly renameUri: vscode.Uri | undefined;
  readonly status: Status;
}

export enum Status {
  INDEX_MODIFIED,
  INDEX_ADDED,
  INDEX_DELETED,
  INDEX_RENAMED,
  INDEX_COPIED,
  MODIFIED,
  DELETED,
  UNTRACKED,
  IGNORED,
  INTENT_TO_ADD,
  ADDED_BY_US,
  ADDED_BY_THEM,
  DELETED_BY_US,
  DELETED_BY_THEM,
  BOTH_ADDED,
  BOTH_DELETED,
  BOTH_MODIFIED
}
```

## Test Scenarios

| # | Scenario | Given | When | Then |
|---|----------|-------|------|------|
| 1.1 | Types compile | Type file created | Run `npm run compile` | No TypeScript errors |
| 1.2 | Can import types | Types exported | Import in FileWatchController | No import errors |

## Acceptance Criteria

- [ ] Types compile without errors
- [ ] Types match Git Extension API v1
- [ ] Can import in FileWatchController
- [ ] All necessary interfaces exported
