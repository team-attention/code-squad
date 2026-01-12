# Task 2: @code-squad/core 패키지 생성

## 목표

`@code-squad/core` 패키지 골격 생성. domain과 application 레이어를 담을 패키지.

## 레이어

Core

## 파일

- `packages/core/package.json` - 생성: 패키지 설정
- `packages/core/tsconfig.json` - 생성: TypeScript 설정
- `packages/core/src/index.ts` - 생성: Public export entry point

## 구현 단계

1. **package.json 생성**
   ```json
   {
     "name": "@code-squad/core",
     "version": "0.1.0",
     "private": true,
     "type": "module",
     "main": "./dist/index.js",
     "types": "./dist/index.d.ts",
     "exports": {
       ".": {
         "import": "./dist/index.js",
         "types": "./dist/index.d.ts"
       }
     },
     "scripts": {
       "build": "tsc",
       "type-check": "tsc --noEmit",
       "test": "vitest run",
       "test:watch": "vitest"
     },
     "devDependencies": {
       "typescript": "^5.3.0",
       "vitest": "^1.0.0"
     }
   }
   ```

2. **tsconfig.json 생성**
   ```json
   {
     "compilerOptions": {
       "target": "ES2022",
       "module": "ESNext",
       "moduleResolution": "bundler",
       "declaration": true,
       "declarationMap": true,
       "outDir": "./dist",
       "rootDir": "./src",
       "strict": true,
       "esModuleInterop": true,
       "skipLibCheck": true,
       "forceConsistentCasingInFileNames": true,
       "composite": true
     },
     "include": ["src/**/*"],
     "exclude": ["node_modules", "dist"]
   }
   ```

3. **src/index.ts 생성 (placeholder)**
   ```typescript
   // @code-squad/core
   // Domain and Application layers
   // Exports will be added in task-4
   export {};
   ```

4. **디렉토리 구조 생성**
   ```bash
   mkdir -p packages/core/src/domain
   mkdir -p packages/core/src/application
   ```

## 검증

- [ ] `pnpm install` 성공
- [ ] `pnpm --filter @code-squad/core type-check` 성공
- [ ] packages/core/src 디렉토리 존재
