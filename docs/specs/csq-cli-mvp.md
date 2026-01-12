# csq CLI MVP

## 요약

터미널에서 worktree 기반 세션을 관리하는 CLI 도구. Code Squad VSCode extension의 Thread Management 기능을 터미널로 가져옴.

## 배경

현재 터미널에서 AI 도구(claude, codex, gemini)를 사용할 때 worktree 관리가 불편함:
- `git worktree add ...` 명령어 직접 입력 필요
- 기존 worktree 목록 확인 후 수동으로 cd
- 세션 상태 추적 어려움

Code Squad의 Thread Management UI를 터미널 CLI로 제공하여 이 문제 해결.

## 요구사항

### 기능적 요구사항

- [ ] FR1: 세션 목록 조회 - 현재 레포의 활성 세션 표시
- [ ] FR2: 새 세션 생성 - Local 또는 Worktree 모드 선택
- [ ] FR3: 기존 worktree 연결 - 이미 있는 worktree에 세션 연결
- [ ] FR4: 세션 정리 - 종료된 세션 자동 정리
- [ ] FR5: 설정 관리 - 레포별 config 생성/편집
- [ ] FR6: 메인 TUI - 인터랙티브 대시보드

### 비기능적 요구사항

- [ ] NFR1: 설치 용이성 - brew로 설치 가능, 의존성 최소화 (fzf, gum)
- [ ] NFR2: 빠른 실행 - Shell script 기반으로 즉시 실행
- [ ] NFR3: @code-squad/core 재사용 - 핵심 로직은 core 패키지 사용

## Use Cases

### UC1: ListSessions

**Actor**: User
**Trigger**: `csq` 또는 `csq list` 실행
**Precondition**: 현재 디렉토리가 git 레포 내부

**Main Flow**:
1. `.code-squad/sessions.json` 읽기
2. 각 세션의 lock file 확인 (`.code-squad/locks/{id}.lock`)
3. PID 생존 여부 확인
4. 활성/종료 세션 구분하여 표시

**Postcondition**: 세션 목록 출력

**Business Rules**:
- lock file 없음 = 종료된 세션
- lock file 있어도 PID 죽었으면 = 종료된 세션

---

### UC2: CreateSession

**Actor**: User
**Trigger**: `csq new [name]` 또는 TUI에서 [n] 선택
**Precondition**: 현재 디렉토리가 git 레포 내부

**Main Flow**:
1. 세션 이름 입력 (인자 없으면 프롬프트)
2. 모드 선택: Local / Worktree
3. Worktree 선택 시:
   - config의 `worktree.basePath` 패턴으로 경로 결정
   - `git worktree add` 실행
   - config의 `copyPatterns` 파일들 복사
4. `sessions.json`에 세션 추가
5. lock file 생성
6. 터미널에서 해당 디렉토리 열기
7. (선택) initCommand 실행

**Postcondition**: 새 세션 생성, 터미널 열림

**Business Rules**:
- 세션 ID는 UUID
- 세션 이름 중복 허용 (ID로 구분)
- worktree 경로는 `{basePath}/{name}` 형식

---

### UC3: AttachWorktree

**Actor**: User
**Trigger**: `csq attach [worktree]` 또는 TUI에서 Available Worktrees 선택
**Precondition**: 기존 worktree 존재

**Main Flow**:
1. 세션 없는 worktree 목록 표시 (fzf)
2. worktree 선택
3. `sessions.json`에 세션 추가
4. lock file 생성
5. 터미널에서 해당 디렉토리 열기

**Postcondition**: 기존 worktree에 세션 연결

---

### UC4: CleanSessions

**Actor**: User
**Trigger**: `csq clean`
**Precondition**: 종료된 세션 존재

**Main Flow**:
1. 종료된 세션 목록 표시
2. 정리할 세션 선택 (다중 선택)
3. worktree도 같이 삭제할지 확인
4. `sessions.json`에서 세션 제거
5. lock file 삭제
6. (선택) worktree 삭제

**Postcondition**: 선택한 세션 정리됨

**Business Rules**:
- worktree 삭제 시 uncommitted changes 확인
- force 옵션으로 강제 삭제 가능

---

### UC5: InitConfig

**Actor**: User
**Trigger**: `csq config init`
**Precondition**: `.code-squad/config.yml` 없음

**Main Flow**:
1. 기본 config 템플릿 생성
2. `.code-squad/` 디렉토리 생성
3. `.gitignore`에 `.code-squad/` 추가 권고

**Postcondition**: 기본 설정 파일 생성

---

### UC6: EditConfig

**Actor**: User
**Trigger**: `csq config`
**Precondition**: 없음

**Main Flow**:
1. config 파일이 없으면 init 먼저 실행
2. $EDITOR로 config 파일 열기

**Postcondition**: config 파일 편집 가능

## 패키지 구조

```
packages/
├── core/           # 기존 - 공통 도메인 로직
├── vscode/         # 기존 - VSCode extension
└── cli/            # 신규 - csq CLI
    ├── bin/
    │   └── csq     # 메인 엔트리포인트 (shell script)
    ├── lib/
    │   ├── commands/
    │   │   ├── list.sh
    │   │   ├── new.sh
    │   │   ├── attach.sh
    │   │   ├── clean.sh
    │   │   └── config.sh
    │   ├── ui/
    │   │   └── tui.sh
    │   └── utils/
    │       ├── session.sh
    │       ├── worktree.sh
    │       └── config.sh
    └── README.md
```

## 설정 구조

### .code-squad/config.yml

```yaml
worktree:
  basePath: "../{repo}.worktree"  # {repo}는 현재 레포 이름으로 치환
  copyPatterns:
    - "node_modules"
    - ".env*"
    - "dist"

terminal:
  opener: "native"              # native | iterm | tmux
  initCommand: ""               # 세션 시작 시 실행할 명령 (비어있으면 실행 안함)
```

### .code-squad/sessions.json

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

## 범위 외

- Hub & Spoke 대시보드 (세션 모니터링)
- 파일 diff 뷰어
- 코멘트 시스템
- 터미널 전송 기능
- Agent 상태 상세화 (working/idle/waiting)

## 미해결 질문

없음

## 성공 기준

- [ ] `csq` 실행 시 메인 TUI 표시
- [ ] `csq new` 로 Local/Worktree 세션 생성
- [ ] `csq attach` 로 기존 worktree 연결
- [ ] `csq list` 로 세션 목록 조회
- [ ] `csq clean` 으로 종료된 세션 정리
- [ ] `csq config init` 으로 기본 설정 생성
