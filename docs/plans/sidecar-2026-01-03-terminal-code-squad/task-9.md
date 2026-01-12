# Task 9: 최종 검증 및 정리

## 목표

전체 마이그레이션 완료 후 최종 검증. 불필요한 파일 정리, 문서 업데이트, 수동 테스트 수행.

## 레이어

Root

## 파일

- `src/` (기존) - 삭제 또는 아카이브
- `README.md` - 업데이트
- `docs/overview.md` - 모노레포 구조 반영

## 구현 단계

1. **기존 src 디렉토리 정리**

   모든 파일이 packages로 이동된 후:
   ```bash
   # 백업 (선택)
   mv src src.bak

   # 또는 삭제
   rm -rf src
   ```

2. **불필요한 루트 파일 정리**

   packages/vscode로 이동된 파일 삭제:
   - .vscodeignore (이동됨)
   - esbuild.config.mjs (이동됨)
   - esbuild-webview.config.mjs (이동됨)

3. **README.md 업데이트**

   모노레포 구조 반영:
   ```markdown
   ## Project Structure

   This is a pnpm workspace monorepo:

   - `packages/core` - @code-squad/core: Domain and Application layers
   - `packages/vscode` - @code-squad/vscode: VSCode extension

   ## Development

   ```bash
   pnpm install
   pnpm run build
   pnpm run test
   ```
   ```

4. **docs/overview.md 업데이트**

   Architecture 섹션에 모노레포 구조 반영:
   ```markdown
   ## Package Structure

   code-squad/
   ├── packages/
   │   ├── core/           # @code-squad/core
   │   │   └── src/
   │   │       ├── domain/
   │   │       └── application/
   │   └── vscode/         # @code-squad/vscode
   │       └── src/
   │           ├── adapters/
   │           └── infrastructure/
   ```

5. **VSIX 패키징 테스트**
   ```bash
   pnpm run package
   ```

   생성 확인:
   - packages/vscode/code-squad-*.vsix

6. **수동 E2E 테스트 (TS6)**

   1. VSCode에 VSIX 설치
   2. 터미널에서 `claude` 실행
   3. Code Squad 패널 열림 확인
   4. 파일 변경 → diff 표시 확인
   5. 코멘트 추가 → 표시 확인
   6. 코멘트 제출 → 터미널 전송 확인
   7. 스레드 생성 → worktree 생성 확인

7. **Git 정리**

   .gitignore 업데이트:
   ```
   # Packages
   packages/*/node_modules
   packages/*/dist
   packages/*/out

   # Build outputs
   *.vsix
   ```

## 테스트 시나리오

- TS6: Extension Activation (Manual)

## 검증

- [ ] 기존 src 디렉토리 정리됨
- [ ] VSIX 패키징 성공
- [ ] 수동 E2E 테스트 통과
- [ ] README/문서 업데이트됨
- [ ] .gitignore 업데이트됨
- [ ] git status clean (변경사항 커밋 후)
