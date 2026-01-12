# Brainstorm: Multi-Session File Routing

## Initial Problem Statement

로컬에서 여러 thread를 spawn하면 Sidecar가 겹친다. A 세션에서 파일 수정한 것과 B 세션에서 파일 수정한 것이 혼란스러울 수 있다. 로컬에서 하나만 허용하거나, 파일 diff에서 어느 세션에서 수정한 건지 마킹하는 방법을 고려.

## Discovery Journey

**Q: 로컬에서 여러 세션이란?**
- 같은 repo에서 여러 thread를 동시에 작업하는 시나리오
- UI가 thread별로 파일 diff가 분리될 것처럼 보이지만, 같은 브랜치에서는 실제 분리가 어려움

**Q: 실제로 해결하고 싶은 것은?**
- 파일 변경 트래킹 자체가 아님
- **코멘트/액션의 올바른 라우팅**이 핵심

**Q: 구체적인 시나리오는?**
- Thread A에서 file1.ts 수정
- Thread B에서 file2.ts 수정
- file1.ts에 코멘트 달고 터미널로 보내면, 현재 포커스가 B여도 A로 가야 함
- A, B 섞어서 코멘트 달면 각각에 맞게 라우팅되어야 함

## Root Problem

**UI 기대 vs 현실의 불일치 + 액션 라우팅 부재**

| 기대 | 현실 |
|------|------|
| Thread A diff만 Thread A에 보임 | 같은 브랜치 = 같은 working directory |
| 코멘트가 해당 thread로 감 | 현재 포커스된 thread로만 감 |

핵심 문제: **코멘트/액션이 "파일을 수정한 thread"가 아닌 "현재 포커스된 thread"로 라우팅됨**

## Solution Space

### Approach 1: File-Thread Mapping (Recommended)

파일별로 마지막 수정 thread를 트래킹하고, 액션 시 해당 thread로 라우팅

```typescript
// 파일 → thread 매핑 (마지막 수정 기준)
Map<filePath, threadId>

// 파일 수정 시
onFileChange(filePath, threadId) → mapping.set(filePath, threadId)

// 코멘트/액션 시
getTargetThread(filePath) → mapping.get(filePath)
```

**장점**:
- 사용자 기대에 부합
- 구현 복잡도 낮음
- 여러 thread 동시 작업 지원

**고려사항**:
- 같은 파일을 여러 thread가 수정하면 마지막 thread가 소유
- 수정 안 한 파일은 Sidecar에 안 뜨므로 매핑 누락 문제 없음

### Approach 2: UI 힌트 추가

Sidecar diff 뷰에서 파일별 소유 thread 표시

```
📁 file1.ts [Thread A]
📁 file2.ts [Thread B]
```

- 사용자가 "이 코멘트는 A로 가겠구나" 예측 가능
- Approach 1과 함께 적용하면 효과적

### Approach 3: 단일 세션 제한

로컬에서 하나의 thread만 활성화 허용

**장점**: 복잡도 제거
**단점**: 기능 제한, 사용자 워크플로우 제약

## Recommendations

1. **Approach 1 (File-Thread Mapping)** 구현 권장
   - 핵심 문제 해결
   - 낮은 구현 복잡도

2. **Approach 2 (UI 힌트)** 함께 적용 고려
   - UX 개선
   - 사용자 혼란 방지

3. Approach 3 (단일 세션 제한)은 비권장
   - 멀티 thread 작업은 유효한 use case

## Next Step

```
/spec multi-session-file-routing
```
