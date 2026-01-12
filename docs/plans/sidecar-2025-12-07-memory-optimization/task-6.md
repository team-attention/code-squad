# Task 6: HNApiGateway Buffer Optimization

## Goal

문자열 연결 대신 Buffer 배열 사용, 응답 크기 제한 추가.

## Files to Modify

- `src/adapters/outbound/gateways/HNApiGateway.ts`

## Technical Approach

### 1. Buffer 배열로 청크 수집

**Before**:
```typescript
let data = '';
res.on('data', (chunk) => {
  data += chunk;
});
res.on('end', () => {
  resolve(JSON.parse(data));
});
```

**After**:
```typescript
const MAX_RESPONSE_SIZE = 1024 * 1024; // 1MB
const chunks: Buffer[] = [];
let totalSize = 0;

res.on('data', (chunk: Buffer) => {
  totalSize += chunk.length;
  if (totalSize > MAX_RESPONSE_SIZE) {
    req.destroy();
    reject(new Error(`Response exceeds ${MAX_RESPONSE_SIZE} bytes limit`));
    return;
  }
  chunks.push(chunk);
});

res.on('end', () => {
  const data = Buffer.concat(chunks).toString('utf8');
  resolve(JSON.parse(data));
});
```

### 2. 에러 처리 강화

```typescript
res.on('error', (error) => {
  chunks.length = 0; // Clear chunks on error
  reject(error);
});
```

### 3. 요청 타임아웃 추가

```typescript
const REQUEST_TIMEOUT = 30000; // 30 seconds

const req = https.get(url, { timeout: REQUEST_TIMEOUT }, (res) => {
  // ...
});

req.on('timeout', () => {
  req.destroy();
  reject(new Error('Request timed out'));
});
```

## Test Scenarios

### Scenario 1: Chunks assembled correctly

**Given**: Response with multiple chunks
**When**: All chunks received
**Then**: Data correctly assembled with Buffer.concat

### Scenario 2: Size limit enforced

**Given**: Response exceeding 1MB
**When**: Size limit reached
**Then**: Request destroyed, error thrown

### Scenario 3: Normal response succeeds

**Given**: Valid API response under 1MB
**When**: Response fully received
**Then**: JSON parsed and returned correctly

### Scenario 4: Timeout handled

**Given**: Server not responding
**When**: 30 seconds elapsed
**Then**: Request destroyed with timeout error

### Scenario 5: Error clears chunks

**Given**: Response in progress
**When**: Network error occurs
**Then**: chunks array cleared, memory freed

## What to Mock

- `https.get` - mock response stream
- Response events - data, end, error

## Acceptance Criteria

- [ ] Buffer 배열로 청크 수집
- [ ] Buffer.concat으로 최종 데이터 생성
- [ ] 1MB 크기 제한
- [ ] 크기 초과 시 요청 중단 및 에러
- [ ] 30초 타임아웃
- [ ] 에러 발생 시 청크 배열 정리
