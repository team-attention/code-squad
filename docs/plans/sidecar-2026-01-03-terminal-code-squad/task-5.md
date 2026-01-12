# Task 5: adapters + infrastructure 코드 이동

## 목표

현재 `src/adapters/`와 `src/infrastructure/`를 `packages/vscode/src/`로 이동. `extension.ts`도 함께 이동.

## 레이어

VSCode (Adapters + Infrastructure)

## 파일

- `src/adapters/**/*` → `packages/vscode/src/adapters/**/*`
- `src/infrastructure/**/*` → `packages/vscode/src/infrastructure/**/*`
- `src/extension.ts` → `packages/vscode/src/extension.ts`
- `src/types/` → `packages/vscode/src/types/` (필요시)

## 구현 단계

1. **adapters 디렉토리 이동**
   ```bash
   cp -r src/adapters/* packages/vscode/src/adapters/
   ```

   이동 대상:
   - inbound/controllers/ (AIDetectionController, etc.)
   - inbound/ui/ (CodeSquadPanelAdapter, ThreadListAdapter, etc.)
   - outbound/gateways/ (VscodeTerminalGateway, VscodeGitGateway, etc.)

2. **infrastructure 디렉토리 이동**
   ```bash
   cp -r src/infrastructure/* packages/vscode/src/infrastructure/
   ```

   이동 대상:
   - repositories/ (JsonCommentRepository, JsonSnapshotRepository, etc.)

3. **extension.ts 이동**
   ```bash
   cp src/extension.ts packages/vscode/src/extension.ts
   ```

4. **types 디렉토리 이동**
   ```bash
   cp -r src/types/* packages/vscode/src/types/
   ```

5. **webview 관련 파일 처리**
   - content/ 디렉토리 → packages/vscode/content/ 또는 루트에 유지
   - assets/ → packages/vscode/assets/ 또는 루트에 유지

   **결정**: webview HTML/CSS는 vscode 패키지로 이동
   ```bash
   cp -r content/* packages/vscode/content/
   ```

6. **빌드 관련 파일 이동**
   - .vscodeignore → packages/vscode/
   - esbuild.config.mjs → packages/vscode/

## 검증

- [ ] 모든 adapters 파일 이동됨
- [ ] 모든 infrastructure 파일 이동됨
- [ ] extension.ts 이동됨
- [ ] 디렉토리 구조 정상
