---
id: flip-blank-page
steps: [clarify, root-cause, fix, verify]
parent: null
children: [root-cause/flip-blank-page]
---

# Clarify: csq flip 빈 페이지 문제

## 요청 요약

배포 후 `csq flip` 명령어가 열어주는 `http://localhost:5173/` 페이지가 아무것도 표시하지 않음.

## 문제 분류

**Bugfix** - 배포된 CLI에서 flip UI가 정상 동작하지 않는 문제

## 분석 결과

### 증상
- `csq flip` 실행 시 브라우저가 열리지만 빈 페이지만 표시됨

### 원인 (초기 분석)

`static.ts`의 경로 계산이 **esbuild 번들링 후** 파일 구조를 고려하지 않음.

**번들링 전 (개발 모드):**
```
packages/cli/
├── src/flip/routes/static.ts   ← __dirname: src/flip/routes
├── flip-ui/dist/               ← '../../../flip-ui/dist' 접근 가능
```

**번들링 후 (배포 모드):**
```
dist/
├── index.js                    ← 모든 코드가 여기에 번들됨
├── flip-ui/dist/               ← index.js에서 './flip-ui/dist' 필요
```

**문제점:**
- 번들된 `index.js`에서 `import.meta.url`은 `dist/index.js`를 가리킴
- `__dirname` = `dist/`
- `path.resolve(__dirname, '../../../flip-ui/dist')` = `packages/cli/` 밖의 잘못된 경로
- 실제 `flip-ui/dist`는 `dist/flip-ui/dist`에 위치

### 배포된 파일 구조 확인

```
/Users/eatnug/.nvm/.../code-squad-cli/dist/
├── index.js                    ← 번들된 메인 파일
├── flip-ui/
│   └── dist/
│       ├── index.html          ← UI 파일 존재
│       └── assets/
```

## Workflow 결정

Bugfix 유형이므로:
**clarify → root-cause → fix → verify**

- `reproduce` 스킵: 이미 원인이 명확함 (경로 계산 오류)
- `root-cause`: static.ts 수정 방안 확정
- `fix`: 코드 수정
- `verify`: 배포 후 테스트

## Scope

### In Scope
- `static.ts`의 distPath 경로 계산 수정
- 번들/비번들 환경 모두에서 동작하도록 수정

### Out of Scope
- flip-ui 기능 자체의 버그 수정
- 빌드 프로세스 변경
