# Task 4: domain + application 코드 이동

## 목표

현재 `src/domain/`과 `src/application/`을 `packages/core/src/`로 이동.

## 레이어

Core

## 파일

- `src/domain/**/*` → `packages/core/src/domain/**/*`
- `src/application/**/*` → `packages/core/src/application/**/*`
- `packages/core/src/index.ts` - 수정: export 추가

## 구현 단계

1. **domain 디렉토리 이동**
   ```bash
   cp -r src/domain/* packages/core/src/domain/
   ```

   이동 대상:
   - entities/ (Comment, Diff, FileSnapshot, Scope, ScopedDiff, ThreadState, etc.)
   - services/ (DiffService, ScopeMappingService, TerminalStatusDetector)
   - valueObjects/
   - index.ts

2. **application 디렉토리 이동**
   ```bash
   cp -r src/application/* packages/core/src/application/
   ```

   이동 대상:
   - ports/inbound/ (IAddCommentUseCase, IGenerateDiffUseCase, etc.)
   - ports/outbound/ (ITerminalPort, IGitPort, ICommentRepository, etc.)
   - useCases/ (AddCommentUseCase, GenerateDiffUseCase, etc.)
   - services/
   - index.ts

3. **packages/core/src/index.ts 수정**
   ```typescript
   // Domain Entities
   export * from './domain/entities';

   // Domain Services
   export * from './domain/services';

   // Application UseCases
   export * from './application/useCases';

   // Application Ports - Inbound
   export * from './application/ports/inbound';

   // Application Ports - Outbound
   export * from './application/ports/outbound';

   // Application Services
   export * from './application/services';
   ```

4. **VSCode-specific UseCases 제외 확인**

   다음 파일들은 core에서 **삭제**하고 vscode 패키지에 유지:
   - CreateThreadUseCase.ts (terminalPort.createTerminal - VSCode Terminal API 의존)
   - DeleteThreadUseCase.ts (동일)
   - OpenInEditorUseCase.ts (IEditorPort - VSCode Editor API 의존)
   - AttachToWorktreeUseCase.ts (workspace API 의존)

   **실제로 검토 결과**: 이 UseCase들은 port 인터페이스를 통해 VSCode API에 접근하므로, core에 유지해도 됨. Port 구현체만 vscode 패키지에 있으면 됨.

5. **vscode import 검증**
   ```bash
   grep -r "from 'vscode'" packages/core/src/
   grep -r "import \* as vscode" packages/core/src/
   ```
   결과가 0이어야 함.

## 테스트 시나리오

- TS5: No vscode Imports in Core

## 검증

- [ ] 모든 domain 파일 이동됨
- [ ] 모든 application 파일 이동됨
- [ ] vscode import 없음 확인
- [ ] `pnpm --filter @code-squad/core type-check` 성공
