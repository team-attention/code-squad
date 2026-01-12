# Brainstorm: Terminal Multi-Agent Experience

## Initial Problem Statement

VSCode extension인 Code Squad를 터미널 기반으로 포팅하고 싶음. 목표는 터미널에서 `claude` 치고 작업하는 개발자들이 멀티스레드로 에이전트 작업하면서 파일 변경사항을 체계적으로 리뷰하고 피드백할 수 있게 하는 것.

## Discovery Journey

### 왜 터미널인가?
- 개인 선호 + 타겟 유저가 터미널/Neovim 사용자
- VSCode에 국한되지 않고 에디터 무관하게 사용하고 싶음

### Claude Squad 경험
- 좋았던 점: Worktree 자동화, 여러 에이전트 병렬, 상태 한눈에, 심플함
- 아쉬웠던 점: 파일 직접 열어보거나 실행할 수 없음

### 핵심 니즈
1. **Diff 보기** - 에이전트가 뭘 바꿨는지 빠르게 확인
2. **코멘트** - 변경에 피드백 달기
3. **코드 이해** - 전체 맥락에서 변경 이해

## Root Problem

> "터미널에서 claude 치고 일하는 개발자들이, 에이전트가 만든 변경사항을 체계적으로 리뷰하고 피드백할 방법이 없다"

Claude Squad의 워크플로우는 좋지만 파일 보기/리뷰 기능이 없고, Code Squad는 VSCode에 국한됨.

## Solution Space

### Approach 1: Standalone TUI (전체 통합)
- 3-column 레이아웃 (스레드바 | 터미널 | 파일뷰)
- Preset 또는 풀스크린 토글로 사이즈 조절
- 장점: 단일 앱으로 완결
- 단점: 터미널 PTY 구현 복잡, 사이즈 조절 제한

### Approach 2: Browser-based Local UI
- localhost 웹서버, 브라우저에서 리뷰
- 장점: 풍부한 UI
- 단점: 브라우저 띄워야 함

### Approach 3: Terminal Split (선택됨) ✅
- 유저가 `code-squad` 실행하면 터미널 split으로 패널들이 열림
- 네이티브 터미널 드래그로 사이즈 조절
- 장점: 익숙한 UX, 유연함, 네이티브 사이즈 조절
- 단점: tmux/터미널 의존

## Recommendations

### 최종 결정: Terminal Split 방식

**레이아웃:**
```
$ code-squad

┌─────────┬──────────────────────┬─────────────────────────┐
│ THREADS │   터미널 (claude)    │      FILE VIEW          │
│ ─────── │                      │   (필요시 열림)         │
│ ▶ T1 ●  │   $ claude "..."     │                         │
│   T2 ○  │   ✓ Edit auth.ts     │   > auth.ts       +15   │
│         │   Done!              │     validate.ts   +28   │
│  [+]    │   ●                  │                         │
│         │                      │   ────────────────      │
│         │                      │   11 + validate();      │
│         │                      │   12 + const t = ...    │
│         │                      │                         │
│         │                      │   COMMENTS (1)          │
│         │                      │   ● auth.ts:17          │
└─────────┴──────────────────────┴─────────────────────────┘
              ↑ 터미널 네이티브 드래그로 사이즈 조절 ↑
```

**라인 선택 UX (Modifier Key 기반):**
- 일반 드래그 → 터미널 기본 동작 (텍스트 선택/복사) 유지
- `Shift+클릭` → TUI 라인 선택 (시작점)
- `Shift+클릭` 두번째 → 범위 선택 (시작~끝)
- `Shift+드래그` → 드래그 범위 선택
- 키보드 폴백: `[c]` 현재 라인 코멘트, `[v]` 선택 모드

**기술 스택:**
- 언어: 상관없음 (Go/Rust/TypeScript 중 선택)
- TUI: bubbletea (Go) / ratatui (Rust) / ink (TS)
- 터미널 통합: tmux send-keys 또는 PTY 직접 제어

**핵심 기능:**
1. 멀티 스레드 관리 (worktree 지원)
2. 파일 변경 diff 뷰어
3. 라인/범위 코멘트
4. 코멘트 → 에이전트 터미널 전송
5. Syntax highlighting

## Next Steps

```
/spec terminal-code-squad
```
