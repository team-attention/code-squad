# Task 3: @code-squad/vscode 패키지 생성

## 목표

`@code-squad/vscode` 패키지 골격 생성. VSCode extension 코드를 담을 패키지.

## 레이어

VSCode (Adapters + Infrastructure)

## 파일

- `packages/vscode/package.json` - 생성: VSCode extension manifest (현재 root package.json 기반)
- `packages/vscode/tsconfig.json` - 생성: TypeScript 설정
- `packages/vscode/.vscodeignore` - 이동: 현재 루트에서 이동
- `packages/vscode/esbuild.config.mjs` - 이동: 현재 루트에서 이동

## 구현 단계

1. **package.json 생성**
   - 현재 root package.json의 extension manifest 부분 복사
   - dependencies/devDependencies 복사
   - @code-squad/core 의존성 추가
   ```json
   {
     "name": "@code-squad/vscode",
     "displayName": "Code Squad",
     "version": "0.1.26",
     "publisher": "your-publisher",
     "engines": { "vscode": "^1.95.0" },
     "main": "./dist/extension.js",
     "dependencies": {
       "@code-squad/core": "workspace:*"
     },
     ...
   }
   ```

2. **tsconfig.json 생성**
   ```json
   {
     "compilerOptions": {
       "target": "ES2022",
       "module": "Node16",
       "moduleResolution": "Node16",
       "outDir": "./out",
       "rootDir": "./src",
       "strict": true,
       "esModuleInterop": true,
       "skipLibCheck": true,
       "forceConsistentCasingInFileNames": true
     },
     "include": ["src/**/*"],
     "exclude": ["node_modules", "out", "dist"],
     "references": [
       { "path": "../core" }
     ]
   }
   ```

3. **.vscodeignore 이동**
   - 현재 루트의 .vscodeignore → packages/vscode/.vscodeignore

4. **esbuild.config.mjs 이동**
   - 현재 루트의 esbuild.config.mjs → packages/vscode/esbuild.config.mjs
   - 경로 조정 필요

5. **디렉토리 구조 생성**
   ```bash
   mkdir -p packages/vscode/src/adapters
   mkdir -p packages/vscode/src/infrastructure
   ```

## 검증

- [ ] package.json에 VSCode extension manifest 정상
- [ ] @code-squad/core 의존성 추가됨
- [ ] 디렉토리 구조 존재
