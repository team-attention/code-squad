# Brainstorm: Thread Status - asking 상태 추가

## Initial Problem Statement

Thread status가 이상함. 현재 4가지 상태:
- `idle`: 터미널 열림, 에이전트 미시작
- `waiting`: 입력 대기 (너무 포괄적)
- `working`: 실행 중
- `error`: 에러 발생

사용자가 원하는 상태:
- `idle`: 동일
- `waiting`: 일반 입력 대기
- `asking`: 권한 요청 / 질문 UI (사용자 응답 필요)
- `working`: 동일

## Discovery Journey

**Q: "이상하다"의 구체적 증상?**
→ 상태 구분이 불명확. `waiting`이 너무 포괄적.

**Q: `waiting`과 `asking` 차이?**
→ 긴급도가 다름
- `waiting`: 사용자가 원할 때 입력하면 됨
- `asking`: 에이전트가 막혀 있음, 사용자가 응답해야 진행됨

**Q: `asking` 조건?**
- Claude: Permission 요청 (y/n), AskUserQuestion 도구
- Codex/Gemini: 유사하게 "유저가 응답해야 하는 상황"

**Q: `asking`일 때 원하는 행동?**
→ 일단 눈에 잘 띄게 (색깔/아이콘)

## Root Problem

**`waiting` 상태가 너무 포괄적 → 유저가 응답해야 하는 긴급한 상황을 구분 못 함**

현재 상태:
```
waiting = 일반 입력 대기 + 권한 요청 + 질문 UI
```

원하는 상태:
```
waiting = 일반 입력 대기
asking  = 권한 요청 + 질문 UI (사용자 응답 필요, 긴급)
```

## Solution Space

### Approach 1: `asking` 상태 추가 (Recommended)

**변경점:**
1. `AgentStatus` 타입: `'asking'` 추가
2. 터미널 파싱: asking 감지 로직 추가
3. UI 스타일: asking용 눈에 띄는 색상 추가

**장점:**
- 명확한 상태 분리
- 확장 가능
- 의미가 직관적

**단점:**
- 각 에이전트별 감지 패턴 필요

### Approach 2: `waiting`에 서브타입 추가

```typescript
type WaitingReason = 'input' | 'permission' | 'question';
interface AgentMetadata {
  status: AgentStatus;
  waitingReason?: WaitingReason;
}
```

**장점:** 기존 상태 유지, 세분화 가능
**단점:** 복잡도 증가, 상태 분기 처리 필요

### Approach 3: 우선순위 기반 표시만 변경

`waiting` 유지하되, 감지된 패턴에 따라 UI만 다르게 표시

**장점:** 상태 모델 변경 없음
**단점:** 상태와 표현의 불일치, 로직 분산

## Recommendations

**Approach 1: `asking` 상태 추가**

이유:
1. 상태 의미가 명확함 (waiting ≠ asking)
2. 코드 변경 범위가 적절함
3. 향후 Codex/Gemini 지원 시 확장 용이
4. UI에서 상태 기반으로 일관된 스타일링 가능

### 구현 범위

1. **Domain**: `AgentStatus` 타입에 `'asking'` 추가
2. **Infrastructure**: 터미널 파싱에서 asking 패턴 감지
3. **UI**: asking 상태용 스타일 추가 (눈에 띄는 색상)

### 감지 패턴

| Agent | Asking 패턴 | 설명 |
|-------|-------------|------|
| Claude | `? Allow`, `Do you want to`, Question UI | Permission 요청, AskUserQuestion |
| Codex | `approve`, `(y/n)`, `Allow` | 파일 편집/명령 실행 전 approval 프롬프트 |
| Gemini | `(Y/n)`, `Shall I proceed` | 시스템 수정 작업 전 confirmation 프롬프트 |

**참고 자료:**
- [Codex CLI](https://developers.openai.com/codex/cli/)
- [Codex Security Guide](https://developers.openai.com/codex/security/)
- [Gemini CLI GitHub](https://github.com/google-gemini/gemini-cli)
- [Gemini CLI auto-approval issue](https://github.com/google-gemini/gemini-cli/issues/5875)

## Next Step

```
/spec thread-status-asking
```
