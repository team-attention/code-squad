# Brainstorm: csq CLI MVP

## 배경 - 기존 방향에서 피벗

### 이전 접근들

**1. Terminal Code Squad (Full Spec)**
- `docs/specs/sidecar-2026-01-03-terminal-code-squad.md`
- 모노레포 재구성 + Terminal TUI 클라이언트
- 3-column 레이아웃 (Threads | Terminal | File View)
- diff 뷰어, 코멘트, 라인 선택 등 전체 기능 이식

**2. Hub & Spoke Architecture**
- `docs/brainstorms/hub-spoke-terminal-ux.md`
- 대시보드 Hub + 독립 터미널 Spoke
- TUI 파일 뷰어 + 코멘트 수집/전송
- tmux 백그라운드로 세션 관리

### 문제점

> "너무 크게 가는 것 같다"

- 구현 복잡도가 높음 (PTY 멀티플렉싱, TUI 파일 뷰어 등)
- 현재 워크플로우 (tmux 패널 분할)도 크게 나쁘지 않음
- 핵심 pain point는 **worktree 관리**

## 피벗: 작게 시작

### 현재 워크플로우

```
1. 터미널 패널 스플릿
2. 각 패널에서 작업 디렉토리로 이동
3. worktree 생성/관리 (불편함 ❌)
4. claude 실행
```

### 실제 Pain Point

| 단계 | 현재 | 불편함 |
|------|------|--------|
| 패널 스플릿 | 수동 | 괜찮음 |
| 디렉토리 이동 | cd | 괜찮음 |
| **worktree 생성** | git worktree add ... | **불편함** |
| **기존 worktree 붙기** | git worktree list → cd | **불편함** |
| claude 실행 | claude | 괜찮음 |

**핵심**: worktree 관리만 편하게 하면 됨

## 솔루션: csq CLI

Code Squad의 worktree 관리 기능만 터미널로 가져온 간단한 CLI 도구.

### 기능 (MVP)

1. **세션 목록 보기** - 현재 레포에서 돌고있는 세션들
2. **새 세션 시작** - Local / Worktree 선택, 경로 설정
3. **기존 worktree 붙기** - 이미 있는 worktree에 세션 연결
4. **세션 정리** - 죽은 세션 자동 정리

### UX

```bash
$ csq
┌──────────────────────────────────────────────────┐
│  Code Squad CLI                                  │
│                                                  │
│  Current Repo: sidecar                           │
│                                                  │
│  [Sessions]                                      │
│  ● auth-feature (worktree) - running             │
│  ● fix-bug (local) - running                     │
│                                                  │
│  [Available Worktrees]                           │
│  ○ ../sidecar.worktree/refactor-api             │
│                                                  │
│  ─────────────────────────────────────────────   │
│  [n] New session  [a] Attach worktree  [q] Quit  │
└──────────────────────────────────────────────────┘
```

### 직접 명령

```bash
csq                    # 메인 TUI
csq new [name]         # 새 세션 (인터랙티브)
csq attach [worktree]  # 기존 worktree에 붙기
csq list               # 세션 목록
csq clean              # 죽은 세션 정리
csq config             # 설정 편집
csq config init        # 기본 설정 생성
```

## 기술 스택

### 선택: Shell + fzf + gum

| 도구 | 역할 |
|------|------|
| Shell (bash/zsh) | 메인 로직 |
| fzf | 선택 UI |
| gum | 입력/확인 UI |

**장점**:
- 빠른 구현
- 의존성 적음 (brew install fzf gum)
- 쉽게 수정 가능

**나중에 필요하면**: Go + bubbletea로 재작성

## Config

### 위치

```
{repo}/.code-squad/
├── config.yml          # 레포별 설정
├── sessions.json       # 세션 목록
└── locks/              # 세션 lock files
    └── {session-id}.lock
```

- 글로벌 설정 없음 (단순하게)
- `.gitignore`에 `.code-squad/` 추가

### config.yml

```yaml
worktree:
  basePath: "../{repo}.worktree"    # 기본 경로 패턴
  copyPatterns:                     # worktree 생성 시 복사할 파일
    - "node_modules"
    - ".env*"
    - "dist"

terminal:
  opener: "native"                  # native | iterm | tmux
  # initCommand: "claude"           # 새 터미널에서 자동 실행
```

### sessions.json

```json
{
  "sessions": [
    {
      "id": "abc123",
      "name": "auth-feature",
      "mode": "worktree",
      "workingDir": "/path/to/worktree",
      "branch": "auth-feature",
      "worktreePath": "/path/to/worktree",
      "createdAt": 1704412800000,
      "pid": 12345
    }
  ]
}
```

## 세션 정리 메커니즘

### 방식: Lock file + PID 체크

```
1. 세션 시작 시:
   - sessions.json에 세션 추가
   - .code-squad/locks/{session-id}.lock 생성
   - trap "rm lock" EXIT 설정

2. csq 실행 시:
   - lock file 없는 세션 → 죽은 것으로 판단
   - lock file 있어도 PID 죽었으면 → 죽은 것으로 판단
   - 죽은 세션은 자동 정리 또는 표시

3. csq clean 실행 시:
   - 모든 죽은 세션 정리
   - worktree도 같이 정리할지 물어봄
```

## Code Squad 기능 매핑

| Code Squad (VSCode) | csq CLI (MVP) | 나중에 |
|---------------------|---------------|--------|
| 세션 목록 | ✅ csq list | - |
| 새 세션 (Local/Worktree) | ✅ csq new | - |
| 기존 worktree 붙기 | ✅ csq attach | - |
| worktree copy patterns | ✅ config | - |
| 세션 상태 (running/done) | ⬚ 기본만 | 상세 상태 |
| 파일 diff 뷰어 | ❌ | Hub & Spoke |
| 코멘트 | ❌ | Hub & Spoke |
| 터미널 전송 | ❌ | Hub & Spoke |

## 확장 경로

```
MVP (csq CLI)
    ↓
세션 상태 상세화 (agent status)
    ↓
Hub 대시보드 (상태 모니터링)
    ↓
파일 뷰어 + 코멘트 (Hub & Spoke 완성)
```

## Next Steps

```bash
# 1. csq 스크립트 생성
# 2. config init 구현
# 3. new session 구현 (local/worktree)
# 4. attach worktree 구현
# 5. list/clean 구현
# 6. 메인 TUI 구현
```

## 관련 문서

- `docs/brainstorms/terminal-multi-agent-experience.md` - 최초 brainstorm
- `docs/brainstorms/hub-spoke-terminal-ux.md` - Hub & Spoke 아키텍처
- `docs/specs/sidecar-2026-01-03-terminal-code-squad.md` - Full spec (나중에)
