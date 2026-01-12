# Task 7: Static Panel Map Cleanup

## Goal

activePanels 맵의 방어적 정리 구현.

## Files to Modify

- `src/adapters/inbound/ui/SidecarPanelAdapter.ts`

## Technical Approach

### 1. 생성 실패 시 정리

```typescript
public static async createNew(
  terminalId: string,
  context: vscode.ExtensionContext,
  dependencies: PanelDependencies
): Promise<SidecarPanelAdapter> {
  // Check for existing panel first
  const existing = SidecarPanelAdapter.activePanels.get(terminalId);
  if (existing) {
    existing.panel.reveal();
    return existing;
  }

  let adapter: SidecarPanelAdapter | null = null;
  try {
    adapter = new SidecarPanelAdapter(terminalId, context, dependencies);
    SidecarPanelAdapter.activePanels.set(terminalId, adapter);
    await adapter.initialize();
    return adapter;
  } catch (error) {
    // Clean up on failure
    if (adapter) {
      SidecarPanelAdapter.activePanels.delete(terminalId);
      try {
        adapter.dispose();
      } catch (disposeError) {
        console.error('[Panel] Error during cleanup:', disposeError);
      }
    }
    throw error;
  }
}
```

### 2. 주기적 stale panel 정리

```typescript
private static cleanupInterval: NodeJS.Timeout | null = null;
private static readonly PANEL_CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

public static startCleanupInterval(): void {
  if (SidecarPanelAdapter.cleanupInterval) return;

  SidecarPanelAdapter.cleanupInterval = setInterval(() => {
    SidecarPanelAdapter.cleanupStalePanels();
  }, SidecarPanelAdapter.PANEL_CLEANUP_INTERVAL_MS);
}

public static stopCleanupInterval(): void {
  if (SidecarPanelAdapter.cleanupInterval) {
    clearInterval(SidecarPanelAdapter.cleanupInterval);
    SidecarPanelAdapter.cleanupInterval = null;
  }
}

private static cleanupStalePanels(): void {
  for (const [terminalId, adapter] of SidecarPanelAdapter.activePanels) {
    try {
      // Check if panel is still valid
      if (!adapter.panel.visible && !adapter.isActive()) {
        SidecarPanelAdapter.activePanels.delete(terminalId);
        adapter.dispose();
      }
    } catch (error) {
      // Panel is in bad state, remove it
      SidecarPanelAdapter.activePanels.delete(terminalId);
    }
  }
}
```

### 3. isActive 체크 메서드

```typescript
private isActive(): boolean {
  try {
    // Accessing panel.visible will throw if panel is disposed
    return this.panel.visible !== undefined;
  } catch {
    return false;
  }
}
```

### 4. dispose 강화

```typescript
public dispose(): void {
  // Always remove from map first
  SidecarPanelAdapter.activePanels.delete(this.terminalId);

  try {
    this.panel.webview.postMessage({ type: 'dispose' });
  } catch (e) {}

  this.disposables.forEach((d) => {
    try {
      d.dispose();
    } catch (e) {}
  });

  try {
    this.panel.dispose();
  } catch (e) {}
}
```

## Test Scenarios

### Scenario 1: Creation failure cleanup

**Given**: Panel creation fails during initialization
**When**: Error is thrown
**Then**: Panel removed from map, resources cleaned up

### Scenario 2: Stale panel detected

**Given**: Panel in map but disposed externally
**When**: Periodic cleanup runs
**Then**: Stale entry removed from map

### Scenario 3: Valid panel not removed

**Given**: Active visible panel
**When**: Periodic cleanup runs
**Then**: Panel remains in map

### Scenario 4: Dispose removes from map first

**Given**: Panel being disposed
**When**: dispose() called
**Then**: Entry removed from map before panel.dispose()

### Scenario 5: Double dispose safe

**Given**: Already disposed panel
**When**: dispose() called again
**Then**: No error thrown

## What to Mock

- `vscode.window.createWebviewPanel` - for creation failure testing
- `panel.visible` - for stale detection

## Acceptance Criteria

- [ ] 생성 실패 시 맵에서 제거
- [ ] 10분마다 stale panel 체크
- [ ] 유효하지 않은 패널 자동 정리
- [ ] dispose 시 맵에서 먼저 제거
- [ ] 중복 dispose 안전하게 처리
- [ ] extension activate 시 cleanup interval 시작
- [ ] extension deactivate 시 cleanup interval 정지
