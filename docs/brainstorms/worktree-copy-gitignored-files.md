# Brainstorm: Worktree 생성 시 Gitignored 파일 복사

## Initial Problem Statement

새 워크트리를 만들 때 gitignored 파일들(`.env` 등)이 없어서 바로 작업을 시작할 수 없음.

## Discovery Journey

**Q1: 어떤 gitignored 파일들이 필요한가?**
- `.env` 등 환경변수 파일
- 프로젝트에 따라 다른 설정 파일들

**Q2: 복사할 파일 목록을 어떻게 관리?**
- 글로벌 VSCode 설정 선호
- 프로젝트별 오버라이드도 가능해야 함 (VSCode 설정 병합 활용)

**Q3: 복사 시점?**
- 워크트리 생성 직후 자동 실행

## Root Problem

워크트리 생성 시 gitignored 파일들을 자동으로 복사하는 메커니즘이 없음.
사용자가 매번 수동으로 필요한 파일을 복사해야 하는 번거로움.

## Solution Space

### Approach 1: VSCode 설정 기반 자동 복사 ✅ 선택

```json
// 글로벌 settings.json
{
  "codeSquad.worktreeCopyPatterns": [".env", ".env.*"]
}

// 프로젝트 .vscode/settings.json (병합됨)
{
  "codeSquad.worktreeCopyPatterns": ["docs/**", "config/local.json"]
}
```

**장점**: VSCode 표준 방식, 익숙함, 자동 병합
**단점**: 설정 변경 시 extension reload 필요할 수 있음

### Approach 2: 전용 설정 파일

```
.vscode/worktree-copy.json  (프로젝트)
~/.config/code-squad/worktree-copy.json  (글로벌)
```

**장점**: 독립적 관리
**단점**: 새로운 파일 위치 학습 필요

### Approach 3: 기존 Whitelist 확장

현재 `codeSquad.includeFiles` 확장

**장점**: 기존 개념 재사용
**단점**: whitelist 본래 용도(diff 표시)와 혼동 가능

## Recommendations

**Approach 1** 선택:
- `codeSquad.worktreeCopyPatterns`: glob 패턴 배열
- VSCode 표준 설정 병합 방식 활용
- CreateThreadUseCase에서 worktree 생성 후 자동 복사
