# Task 7: 빌드 스크립트 설정

## 목표

각 패키지의 빌드 스크립트를 설정하고, 전체 빌드가 정상 동작하도록 구성.

## 레이어

Root + Core + VSCode

## 파일

- `packages/core/package.json` - scripts 확정
- `packages/vscode/package.json` - scripts 확정
- `packages/vscode/esbuild.config.mjs` - 경로 수정
- `package.json` (root) - workspace scripts

## 구현 단계

1. **Core 패키지 빌드 스크립트**

   packages/core/package.json:
   ```json
   {
     "scripts": {
       "build": "tsc",
       "build:watch": "tsc --watch",
       "type-check": "tsc --noEmit",
       "clean": "rm -rf dist",
       "test": "vitest run",
       "test:watch": "vitest"
     }
   }
   ```

2. **VSCode 패키지 빌드 스크립트**

   packages/vscode/package.json:
   ```json
   {
     "scripts": {
       "compile": "pnpm run check-types && node esbuild.config.mjs",
       "compile:webview": "node esbuild-webview.config.mjs",
       "watch": "node esbuild.config.mjs --watch",
       "package": "pnpm run compile && pnpm vsce package --no-dependencies",
       "vscode:prepublish": "pnpm run compile",
       "check-types": "tsc --noEmit",
       "lint": "eslint src --ext ts",
       "test": "vscode-test"
     }
   }
   ```

3. **esbuild.config.mjs 수정**

   packages/vscode/esbuild.config.mjs:
   ```javascript
   // 경로 수정
   const production = process.argv.includes('--production');
   const watch = process.argv.includes('--watch');

   const esbuildConfig = {
     entryPoints: ['src/extension.ts'],
     bundle: true,
     outfile: 'dist/extension.js',
     external: ['vscode'],
     format: 'cjs',
     platform: 'node',
     // @code-squad/core는 번들에 포함됨 (workspace link)
     // external에서 제외
   };
   ```

4. **Root package.json scripts**

   ```json
   {
     "scripts": {
       "build": "pnpm -r build",
       "build:core": "pnpm --filter @code-squad/core build",
       "build:vscode": "pnpm --filter @code-squad/vscode compile",
       "package": "pnpm --filter @code-squad/vscode package",
       "type-check": "pnpm -r type-check",
       "test": "pnpm -r test",
       "lint": "pnpm -r lint",
       "clean": "pnpm -r clean"
     }
   }
   ```

5. **pnpm install 실행**
   ```bash
   pnpm install
   ```

6. **빌드 테스트**
   ```bash
   pnpm run build
   pnpm run type-check
   ```

## 테스트 시나리오

- TS1: Core Package Build
- TS2: VSCode Extension Build
- TS3: Type Check Passes

## 검증

- [ ] `pnpm run build:core` 성공
- [ ] `pnpm run build:vscode` 성공 (compile)
- [ ] `pnpm run type-check` 성공
- [ ] dist/extension.js 생성됨
- [ ] @code-squad/core 코드가 번들에 포함됨
