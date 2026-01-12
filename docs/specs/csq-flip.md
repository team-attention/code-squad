# csq flip - Visual Prompt Composer

## 요약

터미널에서 AI 코딩 에이전트에게 코드 위치 + 코멘트를 시각적으로 전달하는 CLI 도구. 브라우저 기반 UI로 파일 탐색, 라인 선택, 코멘트 작성 후 원래 iTerm 세션에 자동 붙여넣기.

## 배경

AI 코딩 도구(Claude Code, Codex, Gemini)를 터미널에서 사용할 때:
- 특정 코드 위치를 참조하려면 파일 경로와 라인 번호를 수동으로 입력해야 함
- 여러 위치에 코멘트를 남기려면 복잡한 텍스트 포맷팅 필요
- 코드를 보면서 피드백하기 어려움

flip-view(Rust CLI)를 TypeScript로 마이그레이션하여 csq에 통합. brew/npx로 설치 가능하고 iTerm 단축키로 실행.

## 요구사항

### 기능적 요구사항

- [x] FR1: 파일 탐색 - 파일 트리에서 파일 선택, 코드 하이라이팅 표시
- [x] FR2: 라인 선택 + 코멘트 - 드래그로 라인 범위 선택, 코멘트 입력 후 스테이징
- [x] FR3: 스테이징 목록 관리 - 스테이징된 항목 확인, 개별/전체 삭제
- [x] FR4: 포맷팅 및 터미널 전송 - AI 에이전트용 포맷으로 변환 후 터미널에 전송
- [x] FR5: 퍼지 파인더 - Ctrl+P로 파일 빠른 검색
- [x] FR6: Git 상태 표시 - 파일 트리에서 modified/untracked 파일 시각적 표시
- [x] FR7: 멀티 세션 지원 - 여러 터미널 패널에서 동시 사용 가능

### 비기능적 요구사항

- [x] NFR1: csq CLI 통합 - `csq flip` 서브커맨드로 실행
- [x] NFR2: TypeScript 구현 - Rust에서 TypeScript로 마이그레이션
- [x] NFR3: iTerm2 지원 - AppleScript로 원래 세션에 자동 붙여넣기
- [ ] NFR4: brew 배포 - Homebrew formula 작성 (미완료)

## Use Cases

### UC1: Oneshot Mode (기본)

**Actor**: User
**Trigger**: `csq flip` 또는 iTerm 단축키
**Precondition**: 터미널에서 AI 세션 실행 중

**Main Flow**:
1. 서버 시작 (자동 포트 할당)
2. 브라우저에서 웹 UI 열기
3. 사용자가 파일 탐색, 라인 선택, 코멘트 작성
4. Submit 클릭 시:
   - 클립보드에 포맷팅된 텍스트 복사
   - 원래 iTerm 세션에 자동 붙여넣기
   - 서버 종료
5. Cancel 클릭 시 서버만 종료

**Postcondition**: AI 에이전트가 코멘트를 받음

---

### UC2: Serve Mode (데몬)

**Actor**: User
**Trigger**: `csq flip serve`
**Precondition**: 없음

**Main Flow**:
1. 서버 시작 (포트 51234 또는 다음 가용 포트)
2. 서버가 계속 실행됨
3. `csq flip open` 또는 단축키로 브라우저 열기
4. Submit/Cancel 후에도 서버 유지
5. Ctrl+C로 종료

**Postcondition**: 서버가 계속 실행되어 반복 사용 가능

---

### UC3: Multi-Panel Session

**Actor**: User
**Trigger**: 여러 터미널 패널에서 `csq flip` 실행
**Precondition**: iTerm2에서 여러 세션 실행 중

**Main Flow**:
1. 각 패널에서 flip 실행 시 UUID 생성
2. iTerm 세션 ID를 `/tmp/flip-view-session-{uuid}`에 저장
3. 브라우저 URL에 `?session={uuid}` 포함
4. Submit 시 해당 UUID의 세션 파일에서 iTerm 세션 ID 읽기
5. AppleScript로 정확한 세션에 붙여넣기

**Postcondition**: 각 패널에 올바른 코멘트 전송

## 아키텍처

### 컴포넌트 구조

```
packages/cli/
├── src/
│   ├── index.ts              # csq 진입점 (flip 서브커맨드 핸들링)
│   └── flip/
│       ├── index.ts          # runFlip() 함수
│       ├── server/
│       │   └── Server.ts     # Express 서버, 셧다운 메커니즘
│       ├── routes/
│       │   ├── files.ts      # GET /api/files, /api/files/flat
│       │   ├── file.ts       # GET /api/file?path=...
│       │   ├── git.ts        # GET /api/git/status
│       │   ├── submit.ts     # POST /api/submit
│       │   ├── cancel.ts     # POST /api/cancel
│       │   └── static.ts     # SPA 정적 파일 서빙
│       └── output/
│           ├── formatter.ts  # CommentLike -> AI 포맷 변환
│           ├── clipboard.ts  # 클립보드 복사
│           └── autopaste.ts  # iTerm AppleScript 붙여넣기
└── flip-ui/                  # React 웹 UI (별도 workspace)
    └── src/
        ├── App.tsx
        ├── components/       # FileTree, CodeViewer, StagingList, ...
        ├── store/            # Zustand (appStore, stagingStore)
        └── hooks/            # useLineSelection, useKeyboardShortcuts
```

### 데이터 흐름

```
1. csq flip 실행
   │
   ├── iTerm 세션 ID 저장 (/tmp/flip-view-session-{uuid})
   │
   ▼
2. Express 서버 시작 (port 51234+)
   │
   ▼
3. 브라우저 열기 (http://localhost:{port}?session={uuid})
   │
   ▼
4. 웹 UI 상호작용
   ├── GET /api/files → 파일 트리
   ├── GET /api/file?path=... → 파일 내용
   ├── GET /api/git/status → Git 상태
   └── 라인 선택 + 코멘트 → 로컬 스테이징
   │
   ▼
5. Submit
   ├── POST /api/submit { session_id, items }
   ├── formatComments() → AI 포맷 문자열
   ├── copyToClipboard()
   ├── schedulePaste(session_id) → iTerm AppleScript
   └── 서버 종료 (oneshot) 또는 유지 (serve)
```

### 출력 포맷

```
The user has annotated the following code locations:

- src/components/Button.tsx:12-15 -> "이 버튼에 loading 상태 추가해줘"
- src/api/client.ts:45 -> "에러 핸들링 개선 필요"

Please review these comments and address them.
```

## API 명세

### GET /api/files

파일 트리 구조 반환.

**Response**:
```json
{
  "root": "/path/to/project",
  "tree": [
    {
      "path": "src",
      "name": "src",
      "type": "directory",
      "children": [...]
    }
  ]
}
```

### GET /api/files/flat

플랫 파일 목록 (퍼지 파인더용).

**Response**:
```json
{
  "files": ["src/index.ts", "src/App.tsx", ...]
}
```

### GET /api/file?path={relativePath}

파일 내용 반환.

**Response**:
```json
{
  "path": "src/index.ts",
  "content": "...",
  "language": "typescript"
}
```

### GET /api/git/status

Git 상태 반환.

**Response**:
```json
{
  "isGitRepo": true,
  "unstaged": [
    { "path": "src/index.ts", "status": "modified" },
    { "path": "new-file.ts", "status": "untracked" }
  ]
}
```

### POST /api/submit

코멘트 제출 및 서버 종료.

**Request**:
```json
{
  "session_id": "abc-123",
  "items": [
    {
      "filePath": "src/index.ts",
      "startLine": 10,
      "endLine": 15,
      "comment": "이 부분 리팩토링 필요"
    }
  ]
}
```

**Response**:
```json
{ "status": "ok" }
```

### POST /api/cancel

서버 종료 (출력 없음).

**Response**:
```json
{ "status": "ok" }
```

## 키보드 단축키

| 단축키 | 동작 |
|--------|------|
| Ctrl+P / Cmd+P | 퍼지 파인더 열기 |
| Escape | 퍼지 파인더 닫기 / 선택 취소 |
| Cmd+Enter | Submit |
| q | Cancel |

## iTerm 단축키 설정 (권장)

iTerm2 > Preferences > Keys > Key Bindings에서:

```
Keyboard Shortcut: ⌘⇧F (또는 원하는 키)
Action: Send Text with "vim" Special Chars
Text: csq flip\n
```

## 개발 테스트

```bash
cd packages/cli

# flip만 테스트 (web-ui 빌드 포함)
pnpm dev:flip

# 특정 디렉토리로 테스트
pnpm dev:flip /path/to/project

# serve 모드 테스트
pnpm tsx src/index.ts flip serve
```

## 마이그레이션 이력

| 날짜 | 변경 |
|------|------|
| 2025-01-11 | flip-view (Rust) → packages/flip (TypeScript) 마이그레이션 |
| 2025-01-11 | packages/flip → packages/cli 통합 (`csq flip` 서브커맨드) |

## 미완료 항목

| 항목 | 상태 | 다음 단계 |
|------|------|----------|
| brew formula | 미완료 | Homebrew tap 생성 |
| npm publish | 미완료 | 버전 업 후 publish |
| Windows/Linux 지원 | 부분 | 클립보드만 지원, 자동 붙여넣기 미지원 |
