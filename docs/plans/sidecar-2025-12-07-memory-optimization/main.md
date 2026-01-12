# Memory Optimization - Implementation Plan

## Overview

Sidecar extension의 메모리 누수 및 과도한 사용 문제 해결을 위한 구현 계획.

## Problem Summary

| Issue | Location | Severity |
|-------|----------|----------|
| Webview DOM 이벤트 리스너 누적 | `webview/script.ts` | Critical |
| 전역 컬렉션 무한 증가 | `webview/script.ts` | Critical |
| 패널 dispose 시 정리 부족 | `webview/script.ts`, `SidecarPanelAdapter.ts` | Critical |
| eventCountWindow 무한 증가 | `FileWatchController.ts` | High |
| Sessions Map 정리 문제 | `AIDetectionController.ts` | High |
| HNApiGateway 문자열 연결 | `HNApiGateway.ts` | Medium |
| Static Panel Map 누적 | `SidecarPanelAdapter.ts` | Medium |
| State 스프레딩 과다 | `PanelStateManager.ts` | Medium |
| Snapshot 무한 증가 | `InMemorySnapshotRepository.ts` | Medium |

## Technical Design

### Phase 1: Critical Fixes

**AbortController 패턴 도입**: 모든 이벤트 리스너에 signal 전달, dispose 시 abort 호출로 일괄 정리.

**컬렉션 크기 제한**:
- `collapsedFolders`: 1000개 제한
- `diffSearchMatches`: 500개 제한
- `scopedDiffHighlightMap`: 10000개 제한

**Dispose 메시지 핸들링**: 패널 dispose 전 webview에 정리 메시지 전송.

### Phase 2: High Priority

**Circular Buffer**: `eventCountWindow`를 고정 크기 circular buffer로 교체 (1000개).

**Session 타임아웃**: 1시간 비활성 세션 자동 정리, 에러 발생 시 세션 정리.

### Phase 3: Medium Priority

**Buffer 배열 사용**: 문자열 연결 대신 Buffer 배열 후 concat.

**Panel Map 방어적 정리**: 생성 실패 시 정리, 주기적 stale 정리.

**State 업데이트 최적화**: 불필요한 스프레딩 제거.

**Snapshot 제한**: 100개/100KB 제한, LRU eviction.

## Task List

| # | Task | Phase | Files |
|---|------|-------|-------|
| 1 | [Webview Event Listener Cleanup](./task-1.md) | Critical | `webview/script.ts` |
| 2 | [Limit Global Collection Sizes](./task-2.md) | Critical | `webview/script.ts` |
| 3 | [Panel Dispose Message Handler](./task-3.md) | Critical | `webview/script.ts`, `SidecarPanelAdapter.ts` |
| 4 | [Circular Buffer for eventCountWindow](./task-4.md) | High | `FileWatchController.ts` |
| 5 | [Session Timeout and Error Cleanup](./task-5.md) | High | `AIDetectionController.ts` |
| 6 | [HNApiGateway Buffer Optimization](./task-6.md) | Medium | `HNApiGateway.ts` |
| 7 | [Static Panel Map Cleanup](./task-7.md) | Medium | `SidecarPanelAdapter.ts` |
| 8 | [State Update Optimization](./task-8.md) | Medium | `PanelStateManager.ts` |
| 9 | [Snapshot Repository Size Limits](./task-9.md) | Medium | `InMemorySnapshotRepository.ts` |

## Dependencies

```
Task 1 (AbortController) ──┐
Task 2 (Collections)    ───┼── Task 3 (Dispose Handler)
                           │
Task 4 (CircularBuffer) ───┘
Task 5 (Sessions)
Task 6 (HNApiGateway)
Task 7 (Panel Map)
Task 8 (State Updates)
Task 9 (Snapshots)
```

Task 1, 2는 독립적으로 수행 가능. Task 3은 Task 1, 2 완료 후 통합.
Task 4-9는 독립적으로 병렬 수행 가능.

## Success Criteria

- 장시간 사용 후에도 메모리 사용량 안정적 유지
- 패널 열기/닫기 반복해도 메모리 누수 없음
- 파일 변경 이벤트 많아도 메모리 급증 없음
