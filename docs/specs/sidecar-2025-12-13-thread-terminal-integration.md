# Spec: Thread-Terminal Integration & Per-Thread State

## Summary

스레드별 터미널 생성/관리 기능과 스레드별 상태(whitelist, comments) 분리를 구현한다. 이는 brainstorm의 Phase 2, 3에 해당한다.

## Background

`docs/brainstorms/code-squad-multi-agent-view.md`에서 정의된 4단계 구현 중 Phase 1 일부가 구현됨:
- ThreadListController, ThreadTreeDataProvider (스레드 리스트 UI)
- 스레드 선택/전환/사이클 기능
- 기본 "All Agents" 집계 뷰

남은 기능:
- **Phase 2**: 터미널 연동 (스레드별 터미널 생성)
- **Phase 3**: 스레드별 상태 분리 (Whitelist, Comments)
- **Phase 4**: UX 개선 (상태 표시, 리브랜딩) - 별도 spec

## Terms

| Term | Definition |
|------|------------|
| Thread | AI 에이전트 실행 단위. 터미널 + Sidecar 패널 조합 |
| ThreadState | 스레드별 독립 상태 (whitelist patterns, comments) |

## Use Cases

### UC1: CreateThread

| Field | Value |
|-------|-------|
| Actor | User |
| Trigger | 사이드바에서 "New Agent" 버튼 클릭 또는 명령 실행 |
| Precondition | VSCode workspace가 열려있음 |
| Flow | 1. User가 New Agent 버튼 클릭<br>2. 스레드 이름 입력 (필수)<br>3. 옵션 선택: 브랜치 생성 여부, 워크트리 생성 여부<br>4. 브랜치/워크트리 이름 확인 (기본값: 스레드 이름)<br>5. 새 터미널 생성 (워크트리 선택 시 해당 경로에서)<br>6. 스레드가 리스트에 추가됨<br>7. 해당 스레드로 자동 전환 |
| Output | 새 스레드 생성, 터미널 열림 |
| Business Rules | - 에이전트 타입은 자동 감지 (기존 로직 활용)<br>- 브랜치 생성 시 현재 브랜치에서 분기<br>- 워크트리 생성 시 브랜치도 함께 생성 |
| Error | 터미널/브랜치/워크트리 생성 실패 시 에러 메시지 |
| Location | `application/useCases/CreateThreadUseCase.ts` |

### UC2: ManageThreadWhitelist

| Field | Value |
|-------|-------|
| Actor | User |
| Trigger | Sidecar 패널에서 whitelist 관리 버튼 클릭 |
| Precondition | 활성 스레드가 존재 |
| Flow | 1. User가 whitelist 관리 UI 열기<br>2. 패턴 추가/제거<br>3. 변경사항이 해당 스레드에만 적용<br>4. 파일 리스트 갱신 |
| Output | 스레드별 whitelist 패턴 저장 |
| Business Rules | - 각 스레드는 독립된 whitelist 보유<br>- "All Agents" 뷰에서는 모든 스레드의 whitelist 합집합 적용 |
| Location | `application/useCases/ManageWhitelistUseCase.ts` |

### UC3: AddThreadComment

| Field | Value |
|-------|-------|
| Actor | User |
| Trigger | Diff 뷰에서 라인 선택 후 코멘트 추가 |
| Precondition | 스레드가 선택되어 있고 diff가 표시됨 |
| Flow | 1. User가 라인/범위 선택<br>2. 코멘트 텍스트 입력<br>3. 코멘트가 현재 스레드에 저장<br>4. UI 갱신 |
| Output | 스레드별 코멘트 저장 |
| Business Rules | - 코멘트는 스레드별로 독립 관리<br>- 코멘트 제출은 해당 스레드의 터미널로 전송 |
| Location | `application/useCases/AddCommentUseCase.ts` (수정) |

### UC4: SwitchThreadContext

| Field | Value |
|-------|-------|
| Actor | User |
| Trigger | 스레드 리스트에서 다른 스레드 클릭 |
| Precondition | 2개 이상의 스레드 존재 |
| Flow | 1. User가 스레드 클릭<br>2. 현재 스레드 상태 저장 (scroll position 등)<br>3. 새 스레드의 상태 로드<br>4. 터미널 포커스 전환<br>5. Sidecar 패널 갱신 |
| Output | 선택된 스레드의 컨텍스트로 전환 |
| Business Rules | - 스레드 전환 시 whitelist, comments, files가 해당 스레드 것으로 교체 |
| Location | `adapters/inbound/controllers/ThreadListController.ts` (수정) |

## Out of Scope

- Phase 4 UX 개선 (상태 아이콘 애니메이션, 리브랜딩)
- 스레드 병합 기능
- 스레드 삭제 시 브랜치/워크트리 자동 정리

## Data Model

### ThreadState (신규)

```typescript
interface ThreadState {
  threadId: string;
  name: string;                    // 사용자 입력 스레드 이름
  terminalId: string;
  workingDir: string;              // 터미널 cwd (워크트리 경로 또는 기본 workspace)
  branch?: string;                 // 연결된 브랜치 (있는 경우)
  worktreePath?: string;           // 워크트리 경로 (있는 경우)
  whitelistPatterns: string[];
  comments: Comment[];
  createdAt: number;
}
```

### SessionContext 확장

```typescript
interface SessionContext {
  session: AISession;
  stateManager: IPanelStateManager;
  fileWatcher: IFileWatcherPort;
  snapshotManager: ISnapshotManager;
  // 추가
  threadState: ThreadState;
}
```

## UI Changes

### 1. Activity Bar - Sidecar View (Cursor 스타일)

```
┌─────────────────────────┐
│ 🔍 Search Agents...     │  ← 검색 (선택적, 나중에)
├─────────────────────────┤
│ [+ New Agent]           │  ← 버튼
├─────────────────────────┤
│ ◫ All Agents (5)        │
│ ● fix-login-bug (3)     │  ← 사용자 지정 이름
│ ○ add-dark-mode (2)     │
└─────────────────────────┘
```

### 2. New Agent 생성 Flow (Multi-step Quick Pick)

**Step 1: 이름 입력**
```
Enter agent name:
[ fix-login-bug ]
```

**Step 2: 격리 옵션 선택**
```
Select isolation mode:
> ○ Current workspace (no isolation)
  ○ New branch
  ○ New worktree (recommended for parallel work)
```

**Step 3: (브랜치/워크트리 선택 시) 이름 확인**
```
Branch name:
[ fix-login-bug ]          ← 기본값: Step 1 이름, 수정 가능
```

**Step 4: 완료**
- 터미널 생성 + 열기
- 스레드 리스트에 추가
- 해당 스레드로 전환

### 3. Sidecar Panel - Thread Context Indicator

헤더에 현재 스레드 표시 (기존 구현됨):
```
┌─────────────────────────────┐
│ ● fix-login-bug             │  ← 스레드명 + 상태
│ 🌿 feature/fix-login        │  ← 브랜치명 (있는 경우)
│ 3 files changed             │
└─────────────────────────────┘
```

## API Changes

### Commands (package.json)

```json
{
  "command": "sidecar.createAgent",
  "title": "Sidecar: Create New Agent"
}
```

### ITerminalPort 확장

```typescript
interface ITerminalPort {
  // 기존
  sendText(terminalId: string, text: string): Promise<void>;
  showTerminal(terminalId: string): void;

  // 추가
  createTerminal(name: string, cwd?: string): Promise<string>;
}
```

### IGitPort 확장

```typescript
interface IGitPort {
  // 기존
  getDiff(...): Promise<DiffResult>;

  // 추가
  createBranch(name: string, baseBranch?: string): Promise<void>;
  createWorktree(path: string, branch: string): Promise<void>;
  getCurrentBranch(): Promise<string>;
}
```

## Storage

### Thread State Persistence

스레드 상태는 워크스페이스별로 `.vscode/sidecar-threads.json`에 저장:

```json
{
  "threads": [
    {
      "threadId": "uuid-1",
      "name": "fix-login-bug",
      "terminalId": "terminal-1",
      "workingDir": "/path/to/worktree",
      "branch": "fix-login-bug",
      "worktreePath": "/path/to/worktree",
      "whitelistPatterns": ["dist/**"],
      "createdAt": 1702425600000
    }
  ]
}
```

코멘트는 기존 `.vscode/sidecar-comments.json` 사용하되, `threadId` 필드 추가.

## Implementation Notes

1. **터미널 생성**: `vscode.window.createTerminal({ name, cwd })` 사용
2. **브랜치 생성**: `git checkout -b {name}` 실행
3. **워크트리 생성**: `git worktree add {path} -b {branch}` 실행
4. **에이전트 감지**: 기존 AIDetectionController 로직 재활용 (터미널에서 claude/codex/gemini 실행 감지)
5. **상태 분리**: SessionContext에 ThreadState 추가, PanelStateManager는 스레드별 인스턴스

## Success Criteria

1. User가 "New Agent" 버튼으로 이름을 지정하여 새 스레드를 생성할 수 있다
2. 스레드 생성 시 브랜치/워크트리 옵션을 선택할 수 있다
3. 각 스레드가 독립된 터미널을 가진다 (워크트리 선택 시 해당 경로에서 실행)
4. 스레드별로 whitelist 패턴이 독립적으로 관리된다
5. 스레드별로 코멘트가 독립적으로 관리된다
6. 스레드 전환 시 해당 스레드의 상태로 완전히 전환된다
