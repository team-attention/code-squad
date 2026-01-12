# Task 8: 기존 테스트 마이그레이션

## 목표

현재 `src/test/` 디렉토리의 테스트를 적절한 패키지로 이동하고 동작 확인.

## 레이어

Core + VSCode

## 파일

- `src/test/**/*` - 분석 및 분류
- `packages/core/src/test/` - core 테스트 이동
- `packages/vscode/src/test/` - vscode 테스트 이동

## 구현 단계

1. **기존 테스트 분석**
   ```bash
   ls -la src/test/
   ```

   테스트를 두 카테고리로 분류:
   - **Core 테스트**: domain/application 로직 테스트 (vscode 의존 없음)
   - **VSCode 테스트**: adapters/infrastructure 테스트 (vscode 의존)

2. **Core 테스트 이동**

   다음 테스트가 Core로 이동 가능:
   - Domain entities 테스트 (Comment, Diff, etc.)
   - Domain services 테스트 (DiffService, ScopeMappingService)
   - UseCase 테스트 (mock port 사용)

   ```bash
   mkdir -p packages/core/src/test
   # 관련 테스트 파일 이동
   ```

3. **VSCode 테스트 이동**

   다음 테스트가 VSCode 패키지에 유지:
   - Gateway 테스트 (VscodeTerminalGateway)
   - Repository 테스트 (JsonCommentRepository)
   - Extension integration 테스트

   ```bash
   mkdir -p packages/vscode/src/test
   # 관련 테스트 파일 이동
   ```

4. **테스트 import 경로 수정**

   Core 테스트:
   ```typescript
   // Before
   import { Comment } from '../../domain/entities/Comment';

   // After
   import { Comment } from '../domain/entities/Comment';
   ```

   VSCode 테스트:
   ```typescript
   // Before
   import { Comment } from '../../domain/entities/Comment';

   // After
   import { Comment } from '@code-squad/core';
   ```

5. **테스트 실행 확인**
   ```bash
   pnpm --filter @code-squad/core test
   pnpm --filter @code-squad/vscode test
   pnpm run test  # 전체
   ```

## 검증

- [ ] Core 테스트 이동 완료
- [ ] VSCode 테스트 이동 완료
- [ ] 모든 테스트 통과
- [ ] `pnpm run test` 성공
