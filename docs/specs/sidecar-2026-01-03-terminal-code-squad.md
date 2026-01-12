# Terminal Code Squad

## 요약

Code Squad를 모노레포로 재구성하고 Terminal TUI 클라이언트를 추가하여, 터미널 사용자도 멀티 에이전트 작업에서 파일 변경사항을 리뷰하고 피드백할 수 있게 함.

## 배경

### 문제
- 터미널에서 `claude`로 작업하는 개발자들이 에이전트가 만든 변경사항을 체계적으로 리뷰할 방법이 없음
- Claude Squad의 워크플로우는 좋지만 파일 보기/리뷰 기능이 없음
- 현재 Code Squad는 VSCode에 국한됨

### 목표
- 터미널 네이티브 환경에서 동일한 리뷰 경험 제공
- 기존 도메인 로직 재사용으로 중복 방지
- 에디터 무관하게 사용 가능한 도구 제공

### 레퍼런스
- `docs/brainstorms/terminal-multi-agent-experience.md`
- `../thirdcommit/picko` - 모노레포 core 분리 패턴

## 요구사항

### 기능적 요구사항

**Phase 1: 모노레포 재구조화**
- [ ] pnpm workspace 기반 모노레포 설정
- [ ] `@code-squad/core` 패키지로 domain + application 추출
- [ ] `@code-squad/vscode` 패키지로 기존 확장 분리
- [ ] 기존 기능 유지 (regression 없음)

**Phase 2: Terminal TUI 클라이언트**
- [ ] `@code-squad/terminal` 패키지 생성
- [ ] 터미널 분할 레이아웃 (Threads | Terminal | File View)
- [ ] 멀티 스레드 관리 (worktree 지원)
- [ ] 파일 변경 diff 뷰어 (syntax highlighting)
- [ ] 라인/범위 코멘트
- [ ] 코멘트 → 에이전트 터미널 전송

### 비기능적 요구사항
- [ ] 성능: 대용량 diff도 부드럽게 렌더링
- [ ] 호환성: macOS/Linux 터미널, tmux 환경

## Use Cases

### UC1: LaunchTerminalCodeSquad

**Actor**: User
**Trigger**: `code-squad` 명령 실행
**Precondition**: 터미널 환경 (tmux 권장)

**Main Flow**:
1. 사용자가 `code-squad` 실행
2. 시스템이 터미널 분할 레이아웃 생성
3. 왼쪽 패널에 스레드 목록 표시
4. 가운데 패널에 터미널 (빈 상태)
5. 오른쪽 패널 숨김 (필요시 열림)

**Postcondition**: 3-패널 레이아웃 활성화

**Business Rules**:
- tmux 없으면 단일 패널 모드로 폴백
- 기존 tmux 세션 있으면 재사용 옵션 제공

**Location**: `terminal/application/useCases/LaunchAppUseCase`

---

### UC2: CreateTerminalThread

**Actor**: User
**Trigger**: 스레드 목록에서 [+] 선택 또는 단축키
**Precondition**: 앱 실행 중

**Main Flow**:
1. 사용자가 새 스레드 생성 요청
2. 시스템이 isolation 모드 선택 UI 표시 (local/branch/worktree)
3. 사용자가 모드 선택
4. 시스템이 스레드 생성 (git 설정 포함)
5. 가운데 패널에 새 터미널 활성화
6. 스레드 목록 업데이트

**Postcondition**: 새 스레드 활성화, 터미널 준비

**Business Rules**:
- worktree 모드: 별도 디렉토리에 worktree 생성
- branch 모드: 현재 위치에서 새 브랜치 생성
- local 모드: 현재 상태 유지

**Location**: `core/application/useCases/CreateThreadUseCase` (기존 재사용)

---

### UC3: ViewFileDiff

**Actor**: User
**Trigger**: 파일 변경 감지 또는 파일 선택
**Precondition**: 스레드 활성화, 파일 변경 발생

**Main Flow**:
1. 시스템이 변경된 파일 감지
2. 오른쪽 패널에 변경 파일 목록 표시
3. 사용자가 파일 선택
4. 시스템이 unified diff 표시 (syntax highlighting)
5. 추가/삭제/수정 라인 시각적 표시

**Postcondition**: Diff 뷰어에 선택한 파일의 변경사항 표시

**Business Rules**:
- 변경 없으면 "No changes" 메시지
- 바이너리 파일은 "[Binary file]" 표시
- 대용량 파일은 청크 단위 로딩

**Location**: `core/application/useCases/GenerateDiffUseCase` (기존 재사용)

---

### UC4: AddLineComment

**Actor**: User
**Trigger**: Diff 뷰어에서 라인 선택 후 코멘트 액션
**Precondition**: Diff 뷰어 활성화

**Main Flow**:
1. 사용자가 Shift+클릭으로 라인 선택 시작
2. 사용자가 Shift+클릭으로 라인 선택 종료 (범위 선택)
3. 코멘트 입력 프롬프트 표시
4. 사용자가 코멘트 텍스트 입력
5. 시스템이 코멘트 저장
6. 선택 영역에 코멘트 표시 (색상 마커)

**Alternative Flow** (단일 라인):
- 키보드 `[c]` 입력으로 현재 라인에 바로 코멘트

**Postcondition**: 코멘트 저장, 시각적 마커 표시

**Business Rules**:
- 삭제 라인(-) 에는 코멘트 불가
- 동일 라인 중복 코멘트 가능

**Location**: `core/application/useCases/AddCommentUseCase` (기존 재사용)

---

### UC5: SubmitCommentsToAgent

**Actor**: User
**Trigger**: Submit 버튼 또는 단축키
**Precondition**: 1개 이상의 코멘트 존재

**Main Flow**:
1. 사용자가 코멘트 제출 요청
2. 시스템이 코멘트들을 포맷팅
3. 활성 스레드의 터미널에 텍스트 전송
4. 제출된 코멘트 상태 업데이트

**Postcondition**: 코멘트가 에이전트 터미널에 전송됨

**Business Rules**:
- 스레드가 inactive/working 상태면 경고 표시
- 코멘트 포맷: `[File: path:line-range]\ncomment text`

**Location**: `core/application/useCases/SubmitCommentsUseCase` (기존 재사용)

---

### UC6: SwitchThread

**Actor**: User
**Trigger**: 스레드 목록에서 다른 스레드 선택
**Precondition**: 2개 이상의 스레드 존재

**Main Flow**:
1. 사용자가 스레드 선택
2. 가운데 패널이 해당 스레드의 터미널로 전환
3. 오른쪽 패널이 해당 스레드의 변경사항으로 업데이트
4. 스레드 상태 표시 업데이트

**Postcondition**: 선택된 스레드 활성화

**Business Rules**:
- 이전 스레드의 터미널은 백그라운드에서 계속 실행
- 코멘트는 스레드별로 분리

**Location**: `terminal/application/useCases/SwitchThreadUseCase`

## 범위 외

- Windows 지원 (Phase 1에서는 macOS/Linux만)
- 원격 서버 연결
- 다중 프로젝트 동시 관리
- AI 자동 리뷰 기능

## 미해결 질문

1. tmux 없는 환경에서 패널 분할 어떻게 처리?
   - 폴백: 탭 전환 방식?
2. 터미널 PTY 직접 제어 vs tmux send-keys?
   - 권장: tmux send-keys로 시작, 필요시 PTY
3. worktree 경로 기본값?
   - 제안: `.worktrees/{thread-name}`

## 성공 기준

- [ ] 기존 VSCode 확장 기능 100% 유지
- [ ] core 패키지 단독 테스트 통과
- [ ] Terminal TUI에서 기본 워크플로우 완료 가능:
  - 스레드 생성 → AI 실행 → diff 확인 → 코멘트 → 전송
- [ ] macOS + Linux 터미널에서 동작 확인

## 패키지 구조 (제안)

```
code-squad/
├── package.json            # pnpm workspace root
├── pnpm-workspace.yaml
├── packages/
│   ├── core/               # @code-squad/core
│   │   ├── src/
│   │   │   ├── domain/     # entities, services (현재 src/domain)
│   │   │   └── application/ # ports, useCases (현재 src/application)
│   │   └── package.json
│   ├── vscode/             # @code-squad/vscode
│   │   ├── src/
│   │   │   ├── adapters/   # VSCode 어댑터 (현재 src/adapters)
│   │   │   ├── infrastructure/ # VSCode 인프라
│   │   │   └── extension.ts
│   │   └── package.json
│   └── terminal/           # @code-squad/terminal
│       ├── src/
│       │   ├── adapters/   # TUI 어댑터 (Ink 컴포넌트)
│       │   ├── infrastructure/ # 터미널/tmux 인프라
│       │   └── main.ts
│       └── package.json
└── docs/
```

## Core 패키지 내용 (추출 대상)

### Domain
- `Comment.ts`
- `Diff.ts`
- `FileSnapshot.ts`
- `Scope.ts`
- `ScopedDiff.ts`
- `ThreadState.ts`
- `DiffService.ts`
- `ScopeMappingService.ts`
- `TerminalStatusDetector.ts`

### Application
- `AddCommentUseCase.ts`
- `CaptureSnapshotsUseCase.ts`
- `DeleteCommentUseCase.ts`
- `EditCommentUseCase.ts`
- `GenerateDiffUseCase.ts`
- `GenerateScopedDiffUseCase.ts`
- `ManageWhitelistUseCase.ts`
- `SubmitCommentsUseCase.ts`
- `DetectThreadStatusUseCase.ts`
- `TrackFileOwnershipUseCase.ts`
- 모든 Ports (inbound/outbound)

### VSCode-specific (vscode 패키지에 유지)
- `CreateThreadUseCase.ts` → VSCode 터미널 API 의존
- `DeleteThreadUseCase.ts` → VSCode 터미널 API 의존
- `OpenInEditorUseCase.ts` → VSCode 에디터 API 의존
- `AttachToWorktreeUseCase.ts` → VSCode 워크스페이스 API 의존
