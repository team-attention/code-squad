---
id: fd-exhaustion-issue
steps: [root-cause, fix, verify]
parent: clarify/fd-exhaustion-issue
children: [fix/fd-exhaustion-issue]
open_questions: []
learn:
  - findFreePort에서 에러 시 서버 소켓을 닫지 않아 FD 누수 발생
  - Node.js net.createServer()는 listen() 에러 시에도 명시적으로 close() 필요
feedback: []
---

# Root Cause Analysis: 파일 디스크립터 소모 이슈

## 1. Trace: 코드 흐름 추적

### 증상
- CLI/flip 사용 중 프로세스 갑자기 종료
- 이후 시스템 전체 영향 (브라우저, 슬랙 등 실행 불가)
- 파일 디스크립터 소모 추론

### 핵심 발견

**파일: `packages/cli/src/flip/server/Server.ts:95-110`**

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
            findFreePort(preferred + 1).then(resolve);  // ⚠️ server.close() 누락!
        });
    });
}
```

## 2. Analyze: Five Whys

| # | Why? | Answer |
|---|------|--------|
| 1 | 왜 FD가 소모되는가? | 열린 소켓이 닫히지 않고 계속 누적됨 |
| 2 | 왜 소켓이 닫히지 않는가? | `findFreePort` 에러 핸들러에서 `server.close()` 호출 누락 |
| 3 | 왜 에러가 자주 발생하는가? | 이미 사용 중인 포트에 bind 시도 시 에러 발생 |
| 4 | 왜 많은 포트가 사용 중인가? | 서버가 여러 번 시작되거나, 기존 서버가 제대로 종료되지 않음 |
| 5 | 왜 이것이 시스템 전체에 영향을 주는가? | macOS의 파일 디스크립터 제한(ulimit) 도달 시 모든 새 프로세스 영향 |

### Root Cause Summary

**`findFreePort()` 함수에서 포트 충돌 시 `net.createServer()` 소켓을 닫지 않고 재귀 호출.**

각 재귀 호출마다 새 서버 소켓이 생성되지만, 에러 발생한 소켓은 영원히 열려있음.

**시나리오:**
1. flip이 포트 3000에서 시작 시도
2. 포트 3000 사용 중 → 에러 → 소켓 1 열림 (닫히지 않음)
3. 포트 3001 시도 → 사용 중 → 소켓 2 열림 (닫히지 않음)
4. ... 반복 ...
5. 결국 시스템 FD 한도 도달

**macOS 기본 FD 제한:**
```
$ ulimit -n
256  (기본값, 상당히 낮음)
```

## 3. 관련 취약점 (추가 분석)

| 심각도 | 파일 | 위치 | 문제 |
|--------|------|------|------|
| 🔴 Critical | Server.ts | 105-108 | **findFreePort 에러 시 server.close() 누락** |
| 🟠 High | events.ts | 28-30 | SSE 연결 종료 시 res.end() 미호출 (SSEManager가 처리하지만 명시성 부족) |
| 🟡 Medium | clipboard.ts | 16-54 | spawn+unref 패턴 - 좀비 프로세스 가능성 |
| 🟡 Medium | autopaste.ts | 81-85 | spawn+unref 패턴 - 동일 문제 |

## 4. Impact Assessment

### 직접 영향
- **flip 서버 시작 실패**: FD 고갈 시 새 소켓 생성 불가
- **CLI 전체 기능 마비**: 모든 네트워크 작업 실패

### 시스템 영향
- **모든 프로세스 영향**: 브라우저, 슬랙 등 새 앱 실행 불가
- **시스템 불안정**: 재부팅 필요할 수 있음

### 영향받는 사용자
- flip 서버를 자주 재시작하는 사용자
- 여러 포트에서 다른 서비스가 실행 중인 환경

## 5. Fix Options

| Option | 설명 | 장점 | 단점 | Risk |
|--------|------|------|------|------|
| **A. server.close() 추가** | 에러 핸들러에서 close 호출 | 간단, 즉시 적용 가능 | 최소 변경 | Low |
| **B. 포트 검색 로직 재작성** | async/await + try/finally | 더 안전한 구조 | 더 많은 변경 | Medium |
| **C. 포트 검색 라이브러리 사용** | get-port 등 외부 라이브러리 | 검증된 구현 | 의존성 추가 | Low |

### 권장: Option A

가장 간단하고 직접적인 수정. 에러 핸들러에 `server.close()` 추가:

```typescript
server.on('error', () => {
    server.close();  // ← 추가
    findFreePort(preferred + 1).then(resolve);
});
```

## 6. 추가 개선 권장사항

1. **포트 범위 제한**: 무한 재귀 방지
   ```typescript
   if (preferred > 65535) {
       reject(new Error('No available port found'));
       return;
   }
   ```

2. **SSE 연결 정리 강화**: events.ts에서 명시적 res.end() 호출

3. **spawn 프로세스 모니터링**: clipboard.ts, autopaste.ts 개선
