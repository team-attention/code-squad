---
id: fd-exhaustion-issue
steps: [clarify, root-cause, fix, verify]
parent: null
children: [root-cause/fd-exhaustion-issue]
open_questions: []
learn: []
feedback: []
---

# Clarify: 파일 디스크립터 소모 이슈

## 요청 요약

CLI 모듈이나 flip 사용 중 프로세스가 갑자기 종료되고, 이후 브라우저, 슬랙 등 다른 애플리케이션도 실행되지 않는 이슈. 파일 디스크립터 소모가 원인으로 추론됨.

## 증상

1. **CLI/flip 사용 중 갑자기 프로세스 종료**
2. **이후 시스템 전체에 영향**
   - 브라우저 실행 안됨
   - 슬랙 실행 안됨
   - 다른 앱들도 영향받음
3. **추론된 원인**: 파일 디스크립터 고갈

## 수집된 정보

- **재현 조건**: 특정 명령 실행 후 (구체적 명령은 미확인)
- **에러 메시지**: 미확인
- **OS**: macOS (Darwin)

## 분류

- **타입**: Bugfix
- **영역**: CLI 모듈, flip 관련
- **심각도**: Critical (시스템 전체에 영향)

## 워크플로우 결정

재현 조건이 불명확하므로 코드 분석을 통한 root-cause 분석으로 진행:

`clarify → root-cause → fix → verify`

## 분석 방향

1. **CLI/flip 코드에서 파일 디스크립터 관련 코드 탐색**
   - 파일 열기/닫기 패턴
   - 스트림 관리
   - 소켓/네트워크 연결
   - child process spawn

2. **리소스 누수 가능성 조사**
   - 닫히지 않는 파일 핸들
   - 정리되지 않는 프로세스
   - 이벤트 리스너 누적

3. **flip 특이사항 조사**
   - 웹서버 연결 관리
   - Hot reload 메커니즘
