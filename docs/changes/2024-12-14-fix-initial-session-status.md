# Fix: Initial Session Status

## Problem

에이전트 시작 시 세션이 생성되자마자 스피너(⟳)가 돌아감. AI가 아직 아무 작업도 하지 않고 프롬프트를 표시하며 사용자 입력을 기다리는 상태인데도 `working` 상태로 표시됨.

## Root Cause

`AIDetectionController.activateSidecar()`에서 세션 생성 시 초기 상태를 `working`으로 설정함.

## Solution

초기 상태를 `idle`로 변경. AI가 실제로 작업을 시작하면 터미널 출력 감지를 통해 `working`으로 전환됨.

## Files Changed

- `src/adapters/inbound/controllers/AIDetectionController.ts`
  - `session.setAgentMetadata()` 호출 시 `status: 'working'` → `status: 'idle'`

## Status Flow

| 상황 | 상태 | 아이콘 |
|------|------|--------|
| 세션 생성 직후 | `idle` | ─ |
| AI 작업 중 | `working` | ⟳ (회전) |
| AI 프롬프트 대기 | `idle` | ─ |
| y/n 응답 대기 | `waiting` | ? |

## Validation

- ✅ Compile
- ✅ Lint (warnings only)
