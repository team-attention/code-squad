# Task 5: Session Timeout and Error Cleanup

## Goal

비활성 세션 자동 정리 및 에러 발생 시 세션 정리 구현.

## Files to Modify

- `src/adapters/inbound/controllers/AIDetectionController.ts`

## Technical Approach

### 1. SessionContext에 lastActivityTime 추가

```typescript
interface SessionContext {
  // ... existing fields
  lastActivityTime: number;
}
```

### 2. 세션 생성/활동 시 시간 업데이트

```typescript
private createSession(terminalId: string): SessionContext {
  return {
    // ... existing fields
    lastActivityTime: Date.now(),
  };
}

private updateSessionActivity(terminalId: string): void {
  const session = this.sessions.get(terminalId);
  if (session) {
    session.lastActivityTime = Date.now();
  }
}
```

### 3. 주기적 정리 인터벌 추가

```typescript
private readonly SESSION_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour
private readonly CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
private cleanupInterval: NodeJS.Timeout | null = null;

public activate(): void {
  // ... existing code
  this.startCleanupInterval();
}

private startCleanupInterval(): void {
  this.cleanupInterval = setInterval(() => {
    this.cleanupStaleSessions();
  }, this.CLEANUP_INTERVAL_MS);
}

private cleanupStaleSessions(): void {
  const now = Date.now();
  for (const [terminalId, session] of this.sessions) {
    if (now - session.lastActivityTime > this.SESSION_TIMEOUT_MS) {
      this.flushSession(terminalId);
    }
  }
}

public dispose(): void {
  if (this.cleanupInterval) {
    clearInterval(this.cleanupInterval);
    this.cleanupInterval = null;
  }
  // ... existing cleanup
}
```

### 4. 에러 발생 시 세션 정리

```typescript
private async handleTerminalData(terminalId: string, data: string): Promise<void> {
  try {
    // ... existing logic
    this.updateSessionActivity(terminalId);
  } catch (error) {
    console.error('[AIDetection] Error handling terminal data:', error);
    // Clean up session on error
    this.flushSession(terminalId);
  }
}
```

### 5. getActiveSession 최적화

**Before**:
```typescript
getActiveSession(): SessionContext | undefined {
  return Array.from(this.sessions.values()).find(s => s.isActive);
}
```

**After**:
```typescript
getActiveSession(): SessionContext | undefined {
  for (const session of this.sessions.values()) {
    if (session.isActive) return session;
  }
  return undefined;
}
```

## Test Scenarios

### Scenario 1: Stale session cleanup

**Given**: Session inactive for 2 hours
**When**: Periodic cleanup runs
**Then**: Session is flushed and removed from map

### Scenario 2: Active session not cleaned

**Given**: Session active within last hour
**When**: Periodic cleanup runs
**Then**: Session remains in map

### Scenario 3: Error triggers cleanup

**Given**: Active session
**When**: Error occurs during terminal data handling
**Then**: Session is flushed

### Scenario 4: getActiveSession no array copy

**Given**: Multiple sessions in map
**When**: getActiveSession called
**Then**: No Array.from() called, direct iteration used

### Scenario 5: Cleanup interval disposed

**Given**: Controller active with cleanup interval
**When**: Controller disposed
**Then**: Interval is cleared

## What to Mock

- `vscode.window.terminals` - terminal events
- `setInterval` / `clearInterval` - for testing cleanup timing
- `Date.now()` - for time-based testing

## Acceptance Criteria

- [ ] SessionContext에 lastActivityTime 필드 추가
- [ ] 세션 생성/활동 시 시간 업데이트
- [ ] 5분마다 stale session 체크
- [ ] 1시간 이상 비활성 세션 자동 정리
- [ ] 에러 발생 시 세션 정리
- [ ] getActiveSession에서 배열 복사 제거
- [ ] dispose 시 cleanup interval 정리
