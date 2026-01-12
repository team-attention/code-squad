# Code Squad - Project Overview

## What is Code Squad?

Code Squad is a VSCode extension that provides a **multi-agent management and code review interface** for AI coding assistants like Claude Code, Codex, and Gemini CLI. It automatically detects when these AI tools are running, supports multiple parallel agent sessions with git isolation, and displays file changes in a side panel for review and feedback.

## Core Features

### 1. AI Auto-Detection
- Monitors terminal shell executions
- Detects `claude`, `claude-code`, `codex`, and `gemini` commands
- Automatically activates review panel when AI session starts

### 2. File Change Tracking
- Watches workspace files for modifications
- Respects `.gitignore` patterns
- Supports whitelist patterns for gitignored files (e.g., `dist/**`, `.env.*`)

### 3. Diff Viewer
- GitHub-style unified diff display
- Line-by-line comparison
- Visual indicators for additions/deletions

### 4. Comment System
- Add comments on specific lines or line ranges
- Drag-select multiple lines for range comments
- Comments stored in `.vscode/code-squad-comments.json`
- Submit comments directly to AI terminal
- Edit and delete pending comments
- **Inline Comment Display**:
  - Color-coded vertical range indicators (6 color palette)
  - Visual connection from start line to end line
  - Dot marker (●) on comment end lines
  - Comment box border color matches gutter line color
  - Click gutter to toggle comment visibility
  - Comments only attach to addition/context lines (not deletions)
- **Navigation**:
  - Click comment in sidebar to navigate and highlight
  - Multi-line comments highlight entire range
  - Auto-expand collapsed comments when navigating

### 5. Snapshot System
- Captures file state at AI session start
- Generates diffs for gitignored files (not tracked by git)
- Enables review of build outputs, generated files, etc.

### 6. Scope-Based Diff View
- Code changes grouped by scope (class, method, function)
- Uses VSCode LSP document symbols for scope detection
- File root scope contains all content with nested structure
- Toggle between Diff ↔ Scope view for code files
- Toggle between Diff ↔ Preview view for markdown files
- Syntax highlighting in scope view

### 7. Thread Management
- Activity Bar sidebar with thread list webview
- Create new threads with isolation modes:
  - **Local**: Use current branch (no isolation)
  - **Branch**: Create new git branch
  - **Worktree**: Create new git worktree (recommended for parallel work)
- Auto-attach Code Squad panel when thread is created
- Terminals open in editor area as tabs

### 8. Thread Status Detection
- **Activity-based detection**: Terminal output = working, no output = check for idle/waiting patterns
- Status types:
  - `inactive`: No AI session running
  - `idle`: AI waiting for user input (prompt ready)
  - `working`: AI actively processing (output being received)
  - `waiting`: AI waiting for confirmation (y/n prompt)
- Debounced pattern detection (500ms) after output stops
- AI-specific patterns for Claude, Codex, Gemini idle/waiting prompts

## CLI Tools (csq)

Code Squad의 터미널 CLI 도구. VSCode 없이도 AI 코딩 워크플로우 지원.

### csq (기본)
- 인터랙티브 TUI로 worktree/local 세션 관리
- 새 세션 생성, 기존 세션 열기, 삭제
- iTerm2 split pane 지원

### csq flip
- 브라우저 기반 Visual Prompt Composer
- 파일 탐색 + 라인 선택 + 코멘트 작성
- Submit 시 원래 iTerm 세션에 자동 붙여넣기
- 멀티 패널 세션 지원 (UUID 기반 트래킹)

```bash
csq flip              # oneshot: 브라우저 열고 submit 후 종료
csq flip serve        # daemon: 서버 유지, 반복 사용
csq flip open         # 기존 서버에 브라우저만 열기
```

> 상세: [docs/specs/csq-flip.md](specs/csq-flip.md)

## Target Users

- Developers using AI coding assistants (Claude Code, Codex, Gemini CLI)
- Teams reviewing AI-generated code changes
- Anyone wanting structured feedback workflow with AI tools

## Technology Stack

- **Language**: TypeScript
- **Platform**: VSCode Extension API
- **Dependencies**: `ignore` (gitignore pattern matching), VSCode built-in diff/webview APIs

---

# Terms

| Term | Definition |
|------|------------|
| Comment | User feedback on a specific line or line range |
| AISession | Active AI tool session in terminal |
| FileSnapshot | File state captured at session start |
| Diff | Unified diff between snapshot and current file |
| Thread | Independent agent session with optional git isolation |
| ThreadState | Thread metadata (name, terminalId, branch, worktree path) |
| IsolationMode | Thread isolation level: none, branch, or worktree |
| AgentStatus | AI session state: inactive, idle, working, waiting |

---

# Use Cases

| Use Case | Description | Location |
|----------|-------------|----------|
| **AddComment** | 특정 라인/범위에 코멘트 추가 | `application/useCases/AddCommentUseCase.ts` |
| **EditComment** | 기존 코멘트 텍스트 수정 | `application/useCases/EditCommentUseCase.ts` |
| **DeleteComment** | 코멘트 삭제 | `application/useCases/DeleteCommentUseCase.ts` |
| **SubmitComments** | 코멘트를 AI 터미널에 전송 | `application/useCases/SubmitCommentsUseCase.ts` |
| **CaptureSnapshots** | AI 세션 시작 시 파일 상태 캡처 | `application/useCases/CaptureSnapshotsUseCase.ts` |
| **GenerateDiff** | 스냅샷과 현재 파일 간 Diff 생성 | `application/useCases/GenerateDiffUseCase.ts` |
| **GenerateScopedDiff** | LSP 심볼 기반 스코프별 Diff 생성 | `application/useCases/GenerateScopedDiffUseCase.ts` |
| **CreateThread** | 새 스레드 생성 (터미널 + git isolation) | `application/useCases/CreateThreadUseCase.ts` |
| **ManageWhitelist** | 스레드별 whitelist 패턴 관리 | `application/useCases/ManageWhitelistUseCase.ts` |
| **DetectThreadStatus** | 터미널 output 기반 AI 상태 감지 (working/idle/waiting) | `application/useCases/DetectThreadStatusUseCase.ts` |

---

# Architecture

## Hexagonal Architecture (Ports & Adapters)

```
src/
├── domain/                    # Pure business logic (NO vscode imports)
│   ├── entities/              # Business entities
│   └── services/              # Domain services
│
├── application/               # Use cases and ports (NO vscode imports)
│   ├── ports/
│   │   ├── inbound/           # Use case interfaces (I*UseCase.ts)
│   │   └── outbound/          # Dependency interfaces (I*Port.ts, I*Repository.ts)
│   ├── useCases/              # Use case implementations (*UseCase.ts)
│   └── services/              # Application services
│
├── adapters/                  # VSCode integration
│   ├── inbound/
│   │   ├── controllers/       # Event handlers (*Controller.ts)
│   │   └── ui/                # UI adapters (*Adapter.ts)
│   └── outbound/
│       └── gateways/          # External system adapters (*Gateway.ts)
│
├── infrastructure/            # External implementations
│   └── repositories/          # Repository implementations (*Repository.ts)
│
└── extension.ts               # DI container, wiring
```

## Layer Rules

| Layer | Can Import | Cannot Import |
|-------|------------|---------------|
| Domain | Nothing | vscode, node fs, application, adapters |
| Application | Domain | vscode, adapters, infrastructure |
| Adapters | Domain, Application | infrastructure (except via DI) |
| Infrastructure | Domain, Application | adapters |

## Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Entity | `PascalCase.ts` | `Comment.ts` |
| Domain Service | `*Service.ts` | `DiffService.ts` |
| Use Case | `*UseCase.ts` | `AddCommentUseCase.ts` |
| Inbound Port | `I*UseCase.ts` | `IAddCommentUseCase.ts` |
| Outbound Port | `I*Port.ts`, `I*Repository.ts` | `ITerminalPort.ts` |
| Controller | `*Controller.ts` | `AIDetectionController.ts` |
| UI Adapter | `*Adapter.ts` | `CodeSquadPanelAdapter.ts` |
| Gateway | `*Gateway.ts` | `VscodeTerminalGateway.ts` |
| Repository Impl | `*Repository.ts` | `JsonCommentRepository.ts` |

## Data Flow

```
[External Event / User Input]
    ▼
[Inbound Adapter] (Controller / UI)
    │ useCase.execute({...})
    ▼
[UseCase] (Application Layer)
    │ entity.create({...})
    │ outboundPort.doSomething()
    │ return result
    ▼
[Inbound Adapter]
    │ update state, render
    ▼
[Output]
```

---

# Adding New Features

## New UI Panel/View

1. **Create Inbound Adapter** (`adapters/inbound/ui/`)
2. **Create UseCase** (`application/useCases/`)
3. **Wire in extension.ts**

## New External System Integration

1. **Define Outbound Port** (`application/ports/outbound/`)
2. **Implement Gateway** (`adapters/outbound/gateways/`)
3. **Wire in extension.ts**

## New Event Handler

1. **Create Controller** (`adapters/inbound/controllers/`)
2. **Wire in extension.ts**

---

# VSCode Configuration

## Settings (package.json)

```json
{
  "codeSquad.autoDetect": true,
  "codeSquad.autoShowPanel": true,
  "codeSquad.includeFiles": ["dist/**", ".env.*"]
}
```

## Commands

| Command | Description |
|---------|-------------|
| `codeSquad.createAgent` | Create new agent thread |
| `codeSquad.attachToTerminal` | Manually attach Code Squad to terminal |
| `codeSquad.resetAutoOpen` | Reset auto-open panel setting |
