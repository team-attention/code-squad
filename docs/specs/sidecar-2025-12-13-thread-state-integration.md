# Spec: Thread State Integration

## Summary

스레드 전환 시 whitelist와 comments가 해당 스레드 컨텍스트로 필터링되도록 연결한다. 이미 구현된 Comment.threadId, ThreadState.whitelistPatterns를 실제 flow에 연결하는 작업.

## Background

`sidecar-2025-12-13-thread-terminal-integration` 플랜의 Phase 3 중 일부가 구현되었으나 연결되지 않음:

| 구현됨 | 연결 안됨 |
|--------|-----------|
| Comment.threadId | AddCommentUseCase에서 threadId 전달 |
| JsonCommentRepository.findByThreadId | SidecarPanelAdapter에서 thread filtering |
| ThreadState.whitelistPatterns | 스레드 전환 시 적용, 패턴 추가 시 저장 |

## Terms

| Term | Definition |
|------|------------|
| Whitelist | git untracked이지만 file changes에 표시하고 싶은 파일 패턴 |
| Thread Context | 현재 선택된 스레드의 상태 (whitelist patterns, comments) |

## Use Cases

### UC1: ApplyThreadWhitelist

| Field | Value |
|-------|-------|
| Actor | System |
| Trigger | 스레드 전환 시 |
| Precondition | 스레드가 선택됨 |
| Flow | 1. ThreadListController.selectThread 호출<br>2. ThreadState.whitelistPatterns 로드<br>3. FileWatchController에 적용<br>4. 파일 리스트 갱신 |
| Output | 해당 스레드의 whitelist가 적용된 파일 리스트 |
| Business Rules | - Global config + Thread patterns 합집합 적용 |
| Location | `adapters/inbound/controllers/ThreadListController.ts` |

### UC2: SaveWhitelistToThread

| Field | Value |
|-------|-------|
| Actor | User |
| Trigger | 기존 whitelist 추가 flow (파일 우클릭 등) |
| Precondition | 스레드가 선택됨 |
| Flow | 1. User가 whitelist 패턴 추가<br>2. 현재 스레드의 ThreadState에 저장<br>3. 파일 리스트 갱신 |
| Output | 패턴이 현재 스레드에 저장됨 |
| Business Rules | - 스레드 미선택 시 global config에 저장 (기존 동작) |
| Location | `adapters/inbound/controllers/FileWatchController.ts` |

### UC3: AddThreadScopedComment

| Field | Value |
|-------|-------|
| Actor | User |
| Trigger | 코멘트 추가 |
| Precondition | 스레드가 선택됨 |
| Flow | 1. User가 코멘트 입력<br>2. 현재 threadId와 함께 저장 |
| Output | threadId가 포함된 Comment |
| Business Rules | - 스레드 미선택 시 threadId는 null |
| Location | `application/useCases/AddCommentUseCase.ts` |

### UC4: FilterCommentsByThread

| Field | Value |
|-------|-------|
| Actor | System |
| Trigger | 스레드 전환 시 |
| Precondition | 스레드가 선택됨 |
| Flow | 1. threadId로 comments 필터링<br>2. UI 갱신 |
| Output | 해당 스레드의 comments만 표시 |
| Business Rules | - threadId가 null인 코멘트는 모든 뷰에서 표시 |
| Location | `adapters/inbound/ui/SidecarPanelAdapter.ts` |

## Out of Scope

- 스레드 삭제 시 orphan comments/whitelist 정리
- Whitelist 패턴 validation

## Data Flow

### 스레드 전환 시

```
ThreadListController.selectThread(id)
    │
    ├── ThreadStateRepository.findById(id)
    │       └── ThreadState.whitelistPatterns
    │
    ├── FileWatchController.setThreadWhitelist(patterns)
    │
    └── SidecarPanelAdapter.setThreadId(id)
            └── comments 필터링 + 렌더링
```

### 코멘트 추가 시

```
SidecarPanelAdapter.handleAddComment(...)
    │
    └── AddCommentUseCase.execute({ ..., threadId })
```

### Whitelist 패턴 추가 시

```
FileWatchController.addWhitelistPattern(pattern)
    │
    ├── (스레드 선택됨) ThreadState에 저장
    │
    └── (스레드 없음) Global config에 저장 (기존 동작)
```

## API Changes

### AddCommentInput (수정)

```typescript
interface AddCommentInput {
  // 기존 필드...
  threadId?: string;  // 추가
}
```

### FileWatchController (수정)

```typescript
class FileWatchController {
  setThreadWhitelist(patterns: string[]): void;
  setCurrentThreadId(id: string | null): void;  // 패턴 추가 시 저장 위치 결정
}
```

## Implementation Notes

1. **Global + Thread Whitelist 합집합**
   - `effectivePatterns = [...globalPatterns, ...threadPatterns]`

2. **Backward Compatibility**
   - threadId 없는 기존 comments는 모든 뷰에서 표시
   - Thread 없는 sessions는 기존 방식대로 동작

## Success Criteria

1. 스레드 전환 시 해당 스레드의 whitelist 적용됨
2. 스레드 전환 시 해당 스레드의 comments만 표시됨
3. 코멘트 추가 시 현재 threadId 저장됨
4. Whitelist 패턴 추가 시 현재 스레드에 저장됨
