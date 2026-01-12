---
id: flip-input-freeze
steps: [reproduce, root-cause, fix, verify]
parent: clarify/flip-input-freeze
children: [root-cause/flip-input-freeze]
open_questions: []
learn: []
feedback: []
---

# Reproduce: Flip Input Freeze Bug

## Reproduction Steps

1. VSCode에서 키보드 단축키로 Flip 명령 실행
2. Flip 패널이 열리면 파일 선택 또는 코드 뷰어에서 클릭
3. 2-3초 대기
4. 클릭이나 키보드 입력 시도 → **응답 없음**

## Environment

- **실행 방법**: 키보드 단축키
- **발생 시점**: 오픈 후 약 2-3초
- **영향 범위**: 클릭, 키보드 입력 모두 무응답

## Code Analysis

### 관련 파일

| 파일 | 역할 |
|------|------|
| `packages/cli/flip-ui/src/App.tsx` | 메인 앱 컴포넌트, useRealtimeSync/useKeyboardShortcuts 사용 |
| `packages/cli/flip-ui/src/hooks/useKeyboardShortcuts.ts` | 키보드 단축키 처리 |
| `packages/cli/flip-ui/src/hooks/useLineSelection.ts` | 마우스 라인 선택 상태 관리 |
| `packages/cli/flip-ui/src/hooks/useRealtimeSync.ts` | SSE로 실시간 파일 동기화 |
| `packages/cli/flip-ui/src/components/CodeViewer.tsx` | 코드 뷰어, 마우스 이벤트 핸들러 |
| `packages/cli/flip-ui/src/api/index.ts` | API 호출 및 SSE 구독 |
| `packages/cli/src/flip/routes/events.ts` | SSE 서버 엔드포인트 |

### 이벤트 흐름

1. **키보드 이벤트**: `window.addEventListener('keydown')` in `useKeyboardShortcuts.ts`
2. **마우스 이벤트**: 각 `code-line` div에 `onMouseDown/Move/Up` 직접 바인딩 in `CodeViewer.tsx`
3. **SSE 이벤트**: `EventSource` in `api/index.ts` → `useRealtimeSync.ts`에서 처리

### 의심 영역

#### 1. EventSource 연결 문제 (api/index.ts:136-155)

```typescript
subscribeEvents(onEvent: (event: SyncEvent) => void): () => void {
    const eventSource = new EventSource('/api/events')
    eventSource.onerror = (err) => {
        console.error('SSE connection error:', err)
    }
    // 에러 시 재연결 로직 없음
}
```

- SSE 연결 실패 시 복구 로직 없음
- 연결 끊김 후 상태 동기화 불가

#### 2. 마우스 선택 상태 (useLineSelection.ts)

```typescript
const onMouseUp = useCallback(() => {
    if (selecting && selection && onSelectionComplete) {
        onSelectionComplete(selection)
    }
    setSelecting(false)
}, [selecting, selection, onSelectionComplete])
```

- `onMouseUp`이 호출되지 않으면 `selecting` 상태가 `true`로 유지될 수 있음
- 하지만 이것이 2-3초 후 발생하는 것과 직접적 연관성은 낮음

#### 3. SSE 하트비트 (events.ts:23-25)

```typescript
const heartbeat = setInterval(() => {
    res.write(':heartbeat\n\n');
}, 30000);  // 30초 간격
```

- 30초마다 하트비트이므로 2-3초 후 문제와 직접 관련 없음

## Observations

- 코드 분석 결과, 명시적으로 "2-3초 후 이벤트를 비활성화"하는 코드는 없음
- SSE 연결 에러 발생 시 복구 로직이 없어 연결 문제 가능성 있음
- 브라우저/WebView 레벨의 문제일 가능성도 있음

## Next Step

root-cause 단계에서:
1. DevTools Console/Network 탭 확인
2. SSE 연결 상태 모니터링
3. React 컴포넌트 리렌더링 확인
