# Task 1: pnpm workspace 설정

## 목표

pnpm workspace 기반 모노레포 구조 설정. 루트 설정 파일들을 생성하고 packages 디렉토리 구조를 준비.

## 레이어

Root (프로젝트 설정)

## 파일

- `pnpm-workspace.yaml` - 생성: workspace 패키지 정의
- `package.json` - 수정: workspace scripts 추가
- `tsconfig.json` - 수정: project references 설정
- `packages/` - 생성: 패키지 디렉토리

## 구현 단계

1. **pnpm-workspace.yaml 생성**
   ```yaml
   packages:
     - 'packages/*'
   ```

2. **package.json 수정**
   - private: true 확인
   - scripts 추가:
     ```json
     {
       "build": "pnpm -r build",
       "build:core": "pnpm --filter @code-squad/core build",
       "build:vscode": "pnpm --filter @code-squad/vscode build",
       "type-check": "pnpm -r type-check",
       "test": "pnpm -r test",
       "lint": "pnpm -r lint"
     }
     ```

3. **tsconfig.json 수정**
   - project references 추가
   ```json
   {
     "references": [
       { "path": "./packages/core" },
       { "path": "./packages/vscode" }
     ]
   }
   ```

4. **packages 디렉토리 생성**
   ```bash
   mkdir -p packages/core packages/vscode
   ```

## 검증

- [ ] `pnpm install` 성공
- [ ] packages 디렉토리 존재
- [ ] tsconfig.json 문법 오류 없음
