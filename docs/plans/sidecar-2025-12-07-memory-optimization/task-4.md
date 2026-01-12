# Task 4: Circular Buffer for eventCountWindow

## Goal

`eventCountWindow` 배열을 고정 크기 circular buffer로 교체하여 메모리 누수 방지.

## Files to Modify

- `src/adapters/inbound/controllers/FileWatchController.ts`

## Technical Approach

### 1. CircularBuffer 클래스 구현

```typescript
class CircularBuffer<T> {
  private buffer: (T | undefined)[];
  private head = 0;
  private tail = 0;
  private _size = 0;

  constructor(private capacity: number) {
    this.buffer = new Array(capacity);
  }

  push(item: T): void {
    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;
    if (this._size < this.capacity) {
      this._size++;
    } else {
      this.head = (this.head + 1) % this.capacity;
    }
  }

  get size(): number {
    return this._size;
  }

  *[Symbol.iterator](): Iterator<T> {
    for (let i = 0; i < this._size; i++) {
      const index = (this.head + i) % this.capacity;
      yield this.buffer[index] as T;
    }
  }

  countIf(predicate: (item: T) => boolean): number {
    let count = 0;
    for (const item of this) {
      if (predicate(item)) count++;
    }
    return count;
  }

  clear(): void {
    this.buffer = new Array(this.capacity);
    this.head = 0;
    this.tail = 0;
    this._size = 0;
  }
}
```

### 2. FileWatchController 수정

**Before**:
```typescript
private eventCountWindow: number[] = [];

// In handler
this.eventCountWindow.push(Date.now());
this.eventCountWindow = this.eventCountWindow.filter(
  t => Date.now() - t < 10000
);
```

**After**:
```typescript
private eventCountWindow = new CircularBuffer<number>(1000);

// In handler
this.eventCountWindow.push(Date.now());
// No filtering needed - old entries naturally evicted
```

### 3. logStats() 수정

```typescript
private logStats(): void {
  const now = Date.now();
  const recentCount = this.eventCountWindow.countIf(
    t => now - t < 10000
  );
  // Use recentCount instead of array length
}
```

## Test Scenarios

### Scenario 1: Buffer respects capacity

**Given**: CircularBuffer with capacity 1000
**When**: 1500 events are pushed
**Then**: Only last 1000 events are retained

### Scenario 2: Oldest items evicted first

**Given**: Buffer is full
**When**: New item pushed
**Then**: Oldest item is overwritten

### Scenario 3: Counting without array creation

**Given**: Buffer with 500 events
**When**: countIf called for events in last 10 seconds
**Then**: Correct count returned, no array allocated

### Scenario 4: Iterator works correctly

**Given**: Buffer with items
**When**: Iterating with for...of
**Then**: Items returned in insertion order (oldest first)

## What to Mock

None - pure data structure.

## Acceptance Criteria

- [ ] CircularBuffer 클래스 구현
- [ ] 버퍼 크기 1000개로 제한
- [ ] `eventCountWindow` 교체
- [ ] `countIf` 메서드로 필터링 (배열 생성 없음)
- [ ] 기존 이벤트 rate 계산 로직 유지
- [ ] 메모리 사용량 고정
