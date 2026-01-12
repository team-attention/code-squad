---
id: fd-exhaustion-issue
steps: [fix, verify]
parent: root-cause/fd-exhaustion-issue
children: [verify/fd-exhaustion-issue]
open_questions: []
learn:
  - net.createServer()는 listen 에러 시에도 명시적으로 close() 필요
  - 재귀 함수에서 리소스 정리는 각 호출마다 해야 함
  - spawn+unref 패턴은 child.on('error')와 child.on('exit') 핸들러 필요
  - SSE 연결은 req.on('close')에서 res.end() 호출 필요
feedback: []
---

# Fix: 파일 디스크립터 소모 이슈

## 수정 요약

| 항목 | 값 |
|------|-----|
| Bug ID | fd-exhaustion-issue |
| Fix Option | A (server.close() 추가) + 포트 범위 제한 + 관련 리소스 정리 |
| 수정 파일 | Server.ts, events.ts, clipboard.ts, autopaste.ts |

## 변경 내용

### Server.ts:95-115 - findFreePort 함수

**Before:**
```typescript
export async function findFreePort(preferred: number): Promise<number> {
    return new Promise((resolve) => {
        const server = net.createServer();

        server.listen(preferred, '127.0.0.1', () => {
            server.close(() => {
                resolve(preferred);
            });
        });

        server.on('error', () => {
            // Port in use, try next
            findFreePort(preferred + 1).then(resolve);
        });
    });
}
```

**After:**
```typescript
export async function findFreePort(preferred: number, maxPort = 65535): Promise<number> {
    return new Promise((resolve, reject) => {
        if (preferred > maxPort) {
            reject(new Error(`No available port found in range up to ${maxPort}`));
            return;
        }

        const server = net.createServer();

        server.listen(preferred, '127.0.0.1', () => {
            server.close(() => {
                resolve(preferred);
            });
        });

        server.on('error', () => {
            server.close();  // ← FD 누수 수정
            findFreePort(preferred + 1, maxPort).then(resolve).catch(reject);
        });
    });
}
```

### 변경 사항

1. **`server.close()` 추가 (핵심 수정)**
   - 에러 핸들러에서 소켓을 명시적으로 닫음
   - FD 누수 방지

2. **`maxPort` 파라미터 추가**
   - 포트 범위 제한으로 무한 재귀 방지
   - 기본값 65535 (최대 포트 번호)

3. **`reject` 처리 추가**
   - 포트 범위 초과 시 에러 발생
   - 재귀 호출에서 에러 전파

## 검증 결과

| 검증 항목 | 결과 |
|-----------|------|
| Type check (CLI) | ✅ Pass |
| Type check (All packages) | ✅ Pass |
| 기존 테스트 | N/A (CLI 테스트 없음) |

## Side Effects

- **API 변경**: `findFreePort` 함수에 선택적 `maxPort` 파라미터 추가
- **호환성**: 기존 호출 코드는 수정 없이 동작 (기본값 사용)
- **에러 처리**: 포트 범위 초과 시 reject 발생 (이전에는 무한 루프)

## 추가 수정 항목

### events.ts - SSE 연결 정리 강화

**Before:**
```typescript
req.on('close', () => {
    clearInterval(heartbeat);
});
```

**After:**
```typescript
req.on('close', () => {
    clearInterval(heartbeat);
    sseManager.removeClient(res);
    res.end();
});
```

### clipboard.ts - spawn 에러 핸들링 추가

- `spawnWithCleanup` 헬퍼 함수 추가
- `child.on('error')` 핸들러로 임시 파일 정리
- Linux에서 xclip/xsel 폴백 로직을 shell에서 처리하도록 개선

### autopaste.ts - spawn 정리 개선

- `child.on('exit')` 핸들러로 프로세스 완료 시 임시 파일 정리
- `child.on('error')` 핸들러 추가
- timeout을 5초에서 10초로 증가 (safety net)
