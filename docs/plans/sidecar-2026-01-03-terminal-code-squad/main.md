# Implementation Plan: Terminal Code Squad - Phase 1 (Monorepo Restructuring)

## 개요

Code Squad 프로젝트를 pnpm workspace 기반 모노레포로 재구조화하여, 터미널 TUI 클라이언트 추가를 위한 기반을 마련한다.

**Phase 1 범위**:
- pnpm workspace 설정
- `@code-squad/core` 패키지로 domain + application 추출
- `@code-squad/vscode` 패키지로 기존 확장 분리
- 기존 기능 100% 유지 (regression 없음)

**Phase 2 (별도 계획)**: Terminal TUI 클라이언트 (`@code-squad/terminal`)

## 기술 설계

### 1. 패키지 구조

```
code-squad/                          # Project root
├── package.json                     # Root package.json (workspace config)
├── pnpm-workspace.yaml              # pnpm workspace definition
├── tsconfig.json                    # Root tsconfig (references)
├── packages/
│   ├── core/                        # @code-squad/core
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── domain/              # 현재 src/domain (그대로 이동)
│   │       ├── application/         # 현재 src/application (그대로 이동)
│   │       └── index.ts             # Public exports
│   └── vscode/                      # @code-squad/vscode
│       ├── package.json             # VSCode extension manifest
│       ├── tsconfig.json
│       └── src/
│           ├── adapters/            # 현재 src/adapters (그대로 이동)
│           ├── infrastructure/      # 현재 src/infrastructure (그대로 이동)
│           └── extension.ts         # 현재 src/extension.ts
├── docs/                            # 문서 (루트에 유지)
└── assets/                          # 에셋 (루트에 유지)
```

### 2. 패키지 의존성

```
@code-squad/core (0 external deps except types)
  └── No vscode imports
  └── No Node.js fs imports (use ports)

@code-squad/vscode
  └── depends on @code-squad/core
  └── vscode extension API
  └── Node.js built-ins
```

### 3. Build 전략

- **core**: TypeScript → ESM (테스트/개발용)
- **vscode**: esbuild bundle (현재 방식 유지)
- vscode 빌드 시 core 소스를 직접 번들링 (workspace 링크)

### 4. Core 패키지 Export 설계

```typescript
// packages/core/src/index.ts
// Domain Entities
export * from './domain/entities';
export * from './domain/services';

// Application
export * from './application/useCases';
export * from './application/ports/inbound';
export * from './application/ports/outbound';
export * from './application/services';
```

### 5. VSCode 패키지 Import 변경

```typescript
// Before (현재)
import { Comment } from '../../domain/entities/Comment';
import { AddCommentUseCase } from '../useCases/AddCommentUseCase';

// After
import { Comment, AddCommentUseCase } from '@code-squad/core';
```

## 테스트 시나리오

### TS1: Core Package Build

```pseudo
// Arrange
corePackage = packages/core
tsconfig = packages/core/tsconfig.json

// Act
result = exec("pnpm --filter @code-squad/core build")

// Assert
expect(result.exitCode).toBe(0)
expect(fs.exists("packages/core/dist/index.js")).toBe(true)
expect(fs.exists("packages/core/dist/index.d.ts")).toBe(true)
```

### TS2: VSCode Extension Build (No Regression)

```pseudo
// Arrange
vscodePackage = packages/vscode
expectedOutput = "dist/extension.js"

// Act
result = exec("pnpm --filter @code-squad/vscode build")

// Assert
expect(result.exitCode).toBe(0)
expect(fs.exists("packages/vscode/dist/extension.js")).toBe(true)
expect(bundleSize).toBeLessThan(currentBundleSize * 1.1)  // 10% 증가 이하
```

### TS3: Type Check Passes

```pseudo
// Arrange
workspace = project root

// Act
result = exec("pnpm run type-check")

// Assert
expect(result.exitCode).toBe(0)
expect(result.stderr).not.toContain("error TS")
```

### TS4: Import Resolution

```pseudo
// Arrange
vscodeAdapter = packages/vscode/src/adapters/inbound/ui/CodeSquadPanelAdapter.ts

// Assert
// 다음 import가 정상 동작해야 함
import { Comment, AddCommentUseCase } from '@code-squad/core'
expect(Comment).toBeDefined()
expect(AddCommentUseCase).toBeDefined()
```

### TS5: No vscode Imports in Core

```pseudo
// Arrange
coreFiles = glob("packages/core/src/**/*.ts")

// Act
vscodeImports = grep("from 'vscode'", coreFiles)
vscodeRequires = grep("require\\('vscode'\\)", coreFiles)

// Assert
expect(vscodeImports.length).toBe(0)
expect(vscodeRequires.length).toBe(0)
```

### TS6: Extension Activation (Manual)

```pseudo
// Manual Test
1. Run "pnpm --filter @code-squad/vscode package"
2. Install generated .vsix in VSCode
3. Open terminal, run "claude"
4. Verify Code Squad panel opens
5. Make file changes, verify diff view works
6. Add comment, verify it appears
7. Submit comment, verify it goes to terminal
```

## 태스크 목록

| Task | Description | Layer | Dependencies | Test Scenarios |
|------|-------------|-------|--------------|----------------|
| task-1 | pnpm workspace 설정 | Root | - | - |
| task-2 | @code-squad/core 패키지 생성 | Core | task-1 | TS1, TS5 |
| task-3 | @code-squad/vscode 패키지 생성 | VSCode | task-1 | - |
| task-4 | domain + application 코드 이동 | Core | task-2 | TS5 |
| task-5 | adapters + infrastructure 코드 이동 | VSCode | task-3, task-4 | - |
| task-6 | import 경로 업데이트 | Both | task-4, task-5 | TS4 |
| task-7 | 빌드 스크립트 설정 | Both | task-6 | TS1, TS2, TS3 |
| task-8 | 기존 테스트 마이그레이션 | Core | task-7 | - |
| task-9 | 최종 검증 및 정리 | Root | task-8 | TS6 |

## 테스팅 전략

### Unit Tests
- 기존 테스트 파일 `src/test/` → `packages/core/src/test/` 이동
- 테스트 러너: 기존 설정 유지

### Integration Tests
- VSCode Extension Host 테스트: 기존 방식 유지
- core 패키지 import 검증

### E2E Tests
- Manual testing: TS6 (Extension 설치 후 전체 플로우 테스트)

## 위험 요소 및 대응

1. **Import Path 누락**: task-6에서 grep으로 모든 import 검증
2. **빌드 실패**: 각 task 완료 후 즉시 빌드 테스트
3. **Extension 동작 이상**: task-9에서 수동 테스트로 검증
