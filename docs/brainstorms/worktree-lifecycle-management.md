# Brainstorm: Worktree Lifecycle Management

## Initial Problem Statement

워크트리로 병렬 작업 후 정리가 귀찮다. 작업 끝나고 PR 날리고, 워크트리 지우고, 브랜치 지우는 과정을 매뉴얼로 해야 함.

## Discovery Journey

**Q: 현재 정리 과정이 어떻게 되나요?**
- New thread → isolation worktree 설정
- 작업 → 커밋 → 리모트 PR 생성
- 직접 워크트리 삭제 → 브랜치 삭제

**Q: 가장 귀찮은 부분?**
- 여러 명령어를 순서대로 매뉴얼로 실행해야 하는 것

**Q: PR 생성과 정리 타이밍?**
- 명시적으로 유저가 선택할 때 정리
- PR 생성과 Cleanup은 별개 액션으로 분리

**Q: 기존 워크트리 재사용?**
- 기존 워크트리에서 에이전트를 시작하는 기능도 필요 (새로운 발견!)

## Root Problem

**원래 생각**: 워크트리 정리가 귀찮다

**진짜 문제**: 워크트리 lifecycle 관리가 없다

| Lifecycle | 현재 상태 |
|-----------|----------|
| 생성 (Create) | 있음 (New Thread → Worktree) |
| 재사용 (Resume) | 없음 |
| 정리 (Cleanup) | 없음 (수동) |

## Solution Space

### Feature 1: Thread Actions

Thread에 액션 추가 (우클릭 메뉴 또는 버튼):

| Action | 동작 |
|--------|------|
| Create PR | `gh pr create` 실행, PR만 생성 |
| Cleanup | 워크트리 삭제 + 브랜치 삭제 |

**에러 처리:**
| 상황 | 처리 |
|------|------|
| Uncommitted changes | 경고 다이얼로그 + "강제 정리" or "취소" 선택 |
| Push 실패 | 에러 표시 + PR 생성 중단 |
| Worktree 삭제 실패 | 에러 표시 + 수동 명령어 안내 |

### Feature 2: Existing Worktree Attach

Thread 생성 시 기존 워크트리 선택 가능:

**Isolation 옵션 변경:**
```
○ Local           (기존)
○ Branch          (기존)
○ New Worktree    (기존 "Worktree" → 이름 변경)
○ Existing Worktree (새로 추가)
```

**UI 동작:**
- Existing Worktree 선택 시 → Thread name 인풋이 기존 워크트리 셀렉트 박스로 변경
- 선택한 워크트리에 터미널 + Code Squad 연결

## Recommendations

두 기능을 별도 spec으로 분리:

1. **thread-actions**: Create PR, Cleanup 액션 추가
2. **existing-worktree-attach**: 기존 워크트리에 에이전트 연결

우선순위: thread-actions 먼저 (현재 pain point 해결), existing-worktree-attach 이후
