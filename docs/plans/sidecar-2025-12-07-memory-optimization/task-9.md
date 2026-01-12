# Task 9: Snapshot Repository Size Limits

## Goal

InMemorySnapshotRepository에 크기 및 개수 제한 구현.

## Files to Modify

- `src/infrastructure/repositories/InMemorySnapshotRepository.ts`
- `src/application/ports/outbound/ISnapshotRepository.ts` (getStats 추가)

## Technical Approach

### 1. 상수 정의

```typescript
const MAX_SNAPSHOT_COUNT = 100;
const MAX_SNAPSHOT_SIZE = 100 * 1024; // 100KB
```

### 2. LRU 순서 추적

```typescript
export class InMemorySnapshotRepository implements ISnapshotRepository {
  private snapshots = new Map<string, FileSnapshot>();
  private accessOrder: string[] = []; // LRU tracking

  private updateAccessOrder(path: string): void {
    const index = this.accessOrder.indexOf(path);
    if (index !== -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(path);
  }

  private evictOldest(): void {
    if (this.accessOrder.length > 0) {
      const oldest = this.accessOrder.shift()!;
      this.snapshots.delete(oldest);
    }
  }
}
```

### 3. 저장 시 크기 체크

```typescript
public save(snapshot: FileSnapshot): boolean {
  // Check size limit
  const contentSize = Buffer.byteLength(snapshot.content, 'utf8');
  if (contentSize > MAX_SNAPSHOT_SIZE) {
    console.warn(
      `[Snapshot] Skipping ${snapshot.path}: size ${contentSize} exceeds limit ${MAX_SNAPSHOT_SIZE}`
    );
    return false;
  }

  // Evict if at capacity (and not updating existing)
  if (!this.snapshots.has(snapshot.path) && this.snapshots.size >= MAX_SNAPSHOT_COUNT) {
    this.evictOldest();
  }

  this.snapshots.set(snapshot.path, snapshot);
  this.updateAccessOrder(snapshot.path);
  return true;
}
```

### 4. 조회 시 LRU 업데이트

```typescript
public get(path: string): FileSnapshot | undefined {
  const snapshot = this.snapshots.get(path);
  if (snapshot) {
    this.updateAccessOrder(path);
  }
  return snapshot;
}
```

### 5. 통계 메서드

```typescript
public getStats(): { count: number; totalSize: number } {
  let totalSize = 0;
  for (const snapshot of this.snapshots.values()) {
    totalSize += Buffer.byteLength(snapshot.content, 'utf8');
  }
  return {
    count: this.snapshots.size,
    totalSize,
  };
}
```

### 6. Port 인터페이스 업데이트

```typescript
// ISnapshotRepository.ts
export interface ISnapshotRepository {
  save(snapshot: FileSnapshot): boolean; // Changed return type
  get(path: string): FileSnapshot | undefined;
  delete(path: string): void;
  clear(): void;
  getStats(): { count: number; totalSize: number };
}
```

## Test Scenarios

### Scenario 1: Count limit enforced

**Given**: Repository with 100 snapshots
**When**: New snapshot is saved
**Then**: Oldest (LRU) snapshot is evicted, new one saved

### Scenario 2: Size limit enforced

**Given**: File content exceeds 100KB
**When**: Snapshot save attempted
**Then**: Save returns false, snapshot not stored

### Scenario 3: LRU order updated on access

**Given**: Snapshot A then B saved
**When**: Snapshot A is accessed
**Then**: A moves to end of LRU order, B would be evicted first

### Scenario 4: Update existing doesn't evict

**Given**: Repository with 100 snapshots including file X
**When**: File X snapshot updated
**Then**: No eviction, X content updated

### Scenario 5: Stats accurate

**Given**: Repository with snapshots
**When**: getStats() called
**Then**: Correct count and total size returned

### Scenario 6: Clear resets state

**Given**: Repository with snapshots
**When**: clear() called
**Then**: All snapshots and LRU order cleared

## What to Mock

None - repository tests can use real implementation.

## Acceptance Criteria

- [ ] 최대 100개 스냅샷
- [ ] 파일당 최대 100KB
- [ ] 크기 초과 시 저장 거부 및 경고 로그
- [ ] LRU eviction 구현
- [ ] 조회 시 LRU 순서 업데이트
- [ ] getStats() 메서드 추가
- [ ] 기존 테스트 통과
