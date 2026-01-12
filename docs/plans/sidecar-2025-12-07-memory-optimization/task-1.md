# Task 1: Webview Event Listener Cleanup with AbortController

## Goal

AbortController 패턴으로 이벤트 리스너 일괄 정리 구현.

## Files to Modify

- `src/adapters/inbound/ui/webview/script.ts`

## Technical Approach

### 1. Global AbortController 추가

```typescript
// 파일 상단에 추가
let globalAbortController = new AbortController();

function resetAbortController() {
  globalAbortController.abort();
  globalAbortController = new AbortController();
}
```

### 2. 모든 addEventListener에 signal 전달

**Before**:
```typescript
document.addEventListener('mousemove', handleMouseMove);
window.addEventListener('message', handleMessage);
```

**After**:
```typescript
document.addEventListener('mousemove', handleMouseMove, { signal: globalAbortController.signal });
window.addEventListener('message', handleMessage, { signal: globalAbortController.signal });
```

### 3. Dispose 핸들러에서 abort 호출

```typescript
// message handler 내부
case 'dispose':
  globalAbortController.abort();
  break;
```

### 수정 대상 addEventListener

- Line 54-67: `document.addEventListener('mousemove')`, `document.addEventListener('mouseup')`
- Line 291: `window.addEventListener('message')`
- Line 1332-1359: `setupScopeHandlers()` 내부
- Line 2102-2113: `setupPreviewCommentHandlers()` 내부

## Test Scenarios

### Scenario 1: Event listeners cleaned on dispose

**Given**: Panel with active event listeners
**When**: Panel receives dispose message
**Then**: All event listeners are removed

### Scenario 2: New panel has fresh listeners

**Given**: Panel disposed and recreated
**When**: User interacts with new panel
**Then**: Only new listeners are active

### Scenario 3: Abort controller reset works

**Given**: Abort controller aborted
**When**: resetAbortController called
**Then**: New controller is active, old handlers removed

## What to Mock

- `addEventListener` - verify signal passed
- `postMessage` - verify dispose message handling

## Acceptance Criteria

- [ ] 모든 `document.addEventListener` 호출에 signal 전달
- [ ] 모든 `window.addEventListener` 호출에 signal 전달
- [ ] Dispose 메시지 수신 시 abort 호출
- [ ] DOM 재렌더링 전 기존 리스너 제거
- [ ] 패널 닫기 후 이벤트 리스너 누수 없음
