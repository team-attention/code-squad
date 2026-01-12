# Task 6: import 경로 업데이트

## 목표

vscode 패키지의 모든 import 경로를 `@code-squad/core`를 통해 core 패키지를 참조하도록 변경.

## 레이어

VSCode

## 파일

- `packages/vscode/src/**/*.ts` - 모든 TypeScript 파일

## 구현 단계

1. **domain import 변경**

   Before:
   ```typescript
   import { Comment } from '../../domain/entities/Comment';
   import { DiffResult } from '../../domain/entities/Diff';
   import { ThreadState } from '../../domain/entities/ThreadState';
   ```

   After:
   ```typescript
   import { Comment, DiffResult, ThreadState } from '@code-squad/core';
   ```

2. **application import 변경**

   Before:
   ```typescript
   import { IAddCommentUseCase } from '../ports/inbound/IAddCommentUseCase';
   import { AddCommentUseCase } from '../useCases/AddCommentUseCase';
   import { ITerminalPort } from '../ports/outbound/ITerminalPort';
   ```

   After:
   ```typescript
   import {
     IAddCommentUseCase,
     AddCommentUseCase,
     ITerminalPort
   } from '@code-squad/core';
   ```

3. **import 변경이 필요한 파일 목록**

   adapters/inbound/controllers/:
   - AIDetectionController.ts
   - CommandController.ts

   adapters/inbound/ui/:
   - CodeSquadPanelAdapter.ts
   - ThreadListAdapter.ts
   - etc.

   adapters/outbound/gateways/:
   - VscodeTerminalGateway.ts
   - VscodeGitGateway.ts
   - etc.

   infrastructure/repositories/:
   - JsonCommentRepository.ts
   - JsonSnapshotRepository.ts
   - etc.

   extension.ts:
   - DI wiring에서 모든 UseCase import

4. **자동화 스크립트 (선택)**
   ```bash
   # 상대 경로 import 찾기
   grep -r "from '\.\./" packages/vscode/src/
   grep -r "from '\./" packages/vscode/src/

   # domain/application 참조만 필터링
   grep -r "from '.*domain" packages/vscode/src/
   grep -r "from '.*application" packages/vscode/src/
   ```

5. **패키지 내부 import 유지**

   다음 import는 변경 **불필요** (vscode 패키지 내부 참조):
   ```typescript
   // adapters 내부 참조 - 유지
   import { SomeController } from '../controllers/SomeController';

   // infrastructure 참조 - 유지
   import { JsonCommentRepository } from '../../infrastructure/repositories/JsonCommentRepository';
   ```

## 테스트 시나리오

- TS4: Import Resolution

## 검증

- [ ] domain/application 상대 경로 import 0개
- [ ] `@code-squad/core` import로 변경됨
- [ ] `pnpm --filter @code-squad/vscode type-check` 성공
