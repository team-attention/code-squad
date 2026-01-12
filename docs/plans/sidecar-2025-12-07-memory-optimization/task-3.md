# Task 3: Panel Dispose Message Handler

## Goal

패널 dispose 시 webview에 정리 메시지 전송하여 내부 상태 완전 정리.

## Files to Modify

- `src/adapters/inbound/ui/webview/script.ts`
- `src/adapters/inbound/ui/SidecarPanelAdapter.ts`

## Technical Approach

### 1. SidecarPanelAdapter에서 dispose 메시지 전송

`SidecarPanelAdapter.ts`의 dispose 메서드 수정:

```typescript
public dispose(): void {
  // Notify webview to cleanup before destroying
  try {
    this.panel.webview.postMessage({ type: 'dispose' });
  } catch (e) {
    // Panel might already be disposed, ignore
  }

  // Existing cleanup...
  SidecarPanelAdapter.activePanels.delete(this.terminalId);
  this.disposables.forEach((d) => d.dispose());
  this.panel.dispose();
}
```

### 2. Webview에서 dispose 메시지 핸들링

`script.ts`의 message handler에 dispose case 추가:

```typescript
case 'dispose':
  cleanup();
  break;
```

### 3. Cleanup 함수 구현

```typescript
function cleanup() {
  // Task 1: Abort all event listeners
  globalAbortController.abort();

  // Task 2: Clear all collections
  collapsedFolders.clear();
  diffSearchMatches = [];
  scopedDiffHighlightMap.clear();

  // Clear other state
  currentFilePath = '';
  currentDiffLines = [];
  comments = [];

  // Nullify DOM references
  const appElement = document.getElementById('app');
  if (appElement) {
    appElement.innerHTML = '';
  }
}
```

### 4. onDidDispose 이벤트에서도 정리 시도

```typescript
this.panel.onDidDispose(() => {
  // Try to send dispose message (may fail if already disposed)
  try {
    this.panel.webview.postMessage({ type: 'dispose' });
  } catch (e) {}

  this.dispose();
}, null, this.disposables);
```

## Test Scenarios

### Scenario 1: Dispose message sent before panel destruction

**Given**: Panel is active with data
**When**: Panel is disposed programmatically
**Then**: Dispose message is sent to webview before panel destroyed

### Scenario 2: Webview clears state on dispose

**Given**: Webview has active state (collections, DOM, listeners)
**When**: Webview receives dispose message
**Then**: All global state is cleared

### Scenario 3: Cleanup handles missing panel

**Given**: Panel already disposed externally
**When**: dispose() called
**Then**: No error thrown, cleanup completes safely

### Scenario 4: AbortController integrated with cleanup

**Given**: Event listeners attached with AbortController
**When**: cleanup() called
**Then**: globalAbortController.abort() called, all listeners removed

## What to Mock

- `panel.webview.postMessage` - verify dispose message sent
- `panel.dispose` - verify called after cleanup

## Acceptance Criteria

- [ ] Dispose 메시지 패널 destroy 전에 전송
- [ ] Webview에서 dispose 메시지 수신 시 cleanup 함수 호출
- [ ] cleanup() 함수가 모든 전역 상태 정리
- [ ] 이미 dispose된 패널에 대해 에러 없이 처리
- [ ] Task 1 (AbortController)과 Task 2 (Collections)와 통합
