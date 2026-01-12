---
id: flip-input-freeze
steps: [clarify, reproduce, root-cause, fix, verify]
parent: null
children: [reproduce/flip-input-freeze]
open_questions: []
learn: []
feedback: []
---

# Flip Input Freeze Bug

## Summary

Flip 패널을 열고 2-3초 후에 클릭 및 키보드 입력이 멈추는 버그.

## Bug Report

- **증상**: Flip 패널 오픈 후 처음 몇 초는 정상 작동, 이후 모든 입력 무응답
- **재현 방법**: 키보드 단축키로 Flip 실행
- **시간**: 약 2-3초 후 발생
- **DevTools 확인**: 미확인

## Category

- **Type**: Bugfix
- **Workflow**: clarify → reproduce → root-cause → fix → verify

## Scope

### In Scope

- Flip 패널의 입력 이벤트 처리 분석
- 이벤트 핸들러 동작 확인
- 타이머/비동기 작업으로 인한 이벤트 루프 블로킹 가능성

### Out of Scope

- Flip 기능 추가/개선
- UI 변경

## Constraints

- 최소한의 코드 변경으로 해결
- 기존 테스트 통과 필수

## Next Step

reproduce 단계에서 정확한 재현 조건과 절차 문서화 필요.
