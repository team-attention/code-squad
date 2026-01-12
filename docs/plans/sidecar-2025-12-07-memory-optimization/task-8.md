# Task 8: State Update Optimization

## Goal

PanelStateManager에서 불필요한 스프레딩 제거.

## Files to Modify

- `src/application/services/PanelStateManager.ts`

## Technical Approach

### 1. 프리미티브 필드 업데이트 최적화

**Before**:
```typescript
public updateAIStatus(status: AIStatus): void {
  this.state = {
    ...this.state,
    aiStatus: status,
  };
  this.notify();
}
```

**After**:
```typescript
public updateAIStatus(status: AIStatus): void {
  this.state.aiStatus = status;
  this.notify();
}
```

### 2. 배열 업데이트 최적화

**Before**:
```typescript
public addSessionFile(file: SessionFile): void {
  this.state = {
    ...this.state,
    sessionFiles: [...this.state.sessionFiles, file],
  };
  this.notify();
}
```

**After**:
```typescript
public addSessionFile(file: SessionFile): void {
  this.state.sessionFiles.push(file);
  this.notify();
}
```

### 3. 조건부 업데이트

```typescript
public updateSessionFile(filePath: string, updates: Partial<SessionFile>): void {
  const index = this.state.sessionFiles.findIndex(f => f.path === filePath);
  if (index !== -1) {
    Object.assign(this.state.sessionFiles[index], updates);
    this.notify();
  }
}
```

### 4. 벌크 업데이트

```typescript
public updateMultipleFields(updates: Partial<PanelState>): void {
  Object.assign(this.state, updates);
  this.notify();
}
```

### 5. 불변성이 필요한 경우만 복사

특정 외부 인터페이스에서 불변성이 필요한 경우에만 복사:

```typescript
public getStateCopy(): PanelState {
  return {
    ...this.state,
    sessionFiles: [...this.state.sessionFiles],
  };
}
```

## Test Scenarios

### Scenario 1: Primitive update no array copy

**Given**: State with large sessionFiles array
**When**: AI status is updated
**Then**: sessionFiles array reference unchanged

### Scenario 2: Array push efficient

**Given**: sessionFiles has 100 items
**When**: New file added
**Then**: Only push operation, no array spread

### Scenario 3: Object assign for updates

**Given**: SessionFile with properties
**When**: File updated
**Then**: Object.assign used, no new object created

### Scenario 4: Bulk updates efficient

**Given**: Multiple fields to update
**When**: updateMultipleFields called
**Then**: Single Object.assign, single notify

### Scenario 5: Subscribers notified

**Given**: State change
**When**: Any update method called
**Then**: All subscribers notified

## What to Mock

None - pure TypeScript logic.

## Acceptance Criteria

- [ ] 프리미티브 필드 업데이트 시 스프레딩 없음
- [ ] 배열 추가 시 push 사용
- [ ] 배열 수정 시 직접 인덱스 접근
- [ ] Object.assign으로 여러 필드 업데이트
- [ ] 모든 업데이트 후 notify 호출
- [ ] 기존 테스트 통과
