# Spec: Memory Optimization

## Problem

Sidecar 익스텐션이 메모리를 과도하게 사용함. 조사 결과 다음과 같은 주요 원인 발견:

### Critical Issues

1. **Webview DOM 메모리 누적** (`webview/script.ts`)
   - `innerHTML` 재할당 시 이전 DOM 요소의 이벤트 리스너 정리 안됨
   - 파일 전환할 때마다 메모리 누적

2. **전역 컬렉션 무한 증가** (`webview/script.ts`)
   - `collapsedFolders` Set - 폴더 접기/펼치기마다 누적
   - `diffSearchMatches` 배열 - 검색할 때마다 누적
   - 패널 dispose 시에도 정리 안됨

3. **이벤트 리스너 정리 안됨** (`webview/script.ts`)
   - `document.addEventListener('mousemove')` - 항상 실행
   - `window.addEventListener('message')` - postMessage 전체 수신
   - 패널 생성할 때마다 누적

### High Issues

4. **eventCountWindow 배열 무한 증가** (`FileWatchController.ts:24`)
   - 모든 파일 이벤트에 timestamp 추가
   - 필터링은 있지만 비효율적

5. **Sessions Map 정리 문제** (`AIDetectionController.ts`)
   - `flushSession`이 `panel.onDispose()`에서만 호출됨
   - 에러 발생 시 세션 영구 유지

### Medium Issues

6. **HNApiGateway 문자열 연결** (`HNApiGateway.ts:18`)
   - `data += chunk` 반복으로 문자열 복사 반복
   - 응답 크기 제한 없음

7. **Static Panel Map 누적** (`SidecarPanelAdapter.ts:23`)
   - dispose 안 되면 맵에 계속 남음

8. **State 스프레딩 과다** (`PanelStateManager.ts`)
   - 상태 변경마다 `...this.state` 복사
   - 큰 diff/파일 목록에서 메모리 부담

9. **InMemorySnapshotRepository 무한 증가** (`InMemorySnapshotRepository.ts:5`)
   - 파일 내용 전체를 메모리에 보관
   - 크기 제한이나 eviction 정책 없음

## Use Cases

| Use Case | Actor | Trigger | Location |
|----------|-------|---------|----------|
| **CleanupWebviewListeners** | System | 패널 dispose 시 | adapters/inbound/ui/ |
| **LimitCollectionSize** | System | 컬렉션 추가 시 | 전역 |
| **DisposeEventListeners** | System | DOM 재렌더링 시 | webview/script.ts |
| **CleanupStaleSessions** | System | 주기적 또는 에러 발생 시 | AIDetectionController.ts |
| **OptimizeStateUpdates** | System | 상태 변경 시 | PanelStateManager.ts |

## Solution Approach

### Phase 1: Critical Fixes

1. **Webview 이벤트 리스너 관리**
   - AbortController 패턴으로 리스너 일괄 정리
   - DOM 재렌더링 전 기존 리스너 제거

2. **전역 컬렉션 크기 제한**
   - `collapsedFolders`: 최대 1000개
   - `diffSearchMatches`: 최대 500개
   - `eventCountWindow`: circular buffer로 변경 (최대 1000개)

3. **패널 dispose 시 정리 강화**
   - `vscode.postMessage({ type: 'dispose' })` 수신 시 webview 내부 정리

### Phase 2: High Priority

4. **Sessions 타임아웃 기반 정리**
   - 1시간 이상 비활성 세션 자동 정리
   - `getActiveSession()` 배열 복사 제거

5. **FileWatchController 최적화**
   - `eventCountWindow`를 circular buffer로
   - 최대 1000개 이벤트만 유지

### Phase 3: Medium Priority

6. **HNApiGateway Buffer 사용**
   - 문자열 연결 대신 Buffer 배열 사용
   - 최대 응답 크기 제한 (1MB)

7. **Static Panel Map 정리**
   - dispose 실패 시에도 맵에서 제거
   - 주기적 stale panel 정리

8. **State 업데이트 최적화**
   - 불필요한 스프레딩 제거
   - 변경된 부분만 업데이트

9. **Snapshot 크기 제한**
   - 파일당 최대 크기 제한 (100KB)
   - 전체 스냅샷 개수 제한 (100개)

## Success Criteria

- 장시간 사용 후에도 메모리 사용량 안정적 유지
- 패널 열기/닫기 반복해도 메모리 누수 없음
- 파일 변경 이벤트 많아도 메모리 급증 없음

## Out of Scope

- Webview 전체 재작성
- 아키텍처 변경
