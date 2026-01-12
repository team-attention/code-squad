---
id: flip-blank-page
steps: [fix, verify]
parent: root-cause/flip-blank-page
children: [verify/flip-blank-page]
---

# Fix: csq flip 빈 페이지 문제

## Bug ID
flip-blank-page

## Selected Fix Option
**Option A: 번들 감지** - `index.js` 파일명 여부로 번들 환경 감지 후 경로 분기

## Changes

### File: `packages/cli/src/flip/routes/static.ts`

**Before:**
```typescript
// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the built web-ui
// In development (tsx): __dirname is src/flip/routes, go up 3 levels to packages/cli
// In production (bundled): __dirname is dist/flip/routes, go up 3 levels to packages/cli
const distPath = path.resolve(__dirname, '../../../flip-ui/dist');
```

**After:**
```typescript
// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detect if running from bundled index.js or unbundled source
// - Bundled: __filename = dist/index.js → flip-ui is at dist/flip-ui/dist
// - Unbundled: __filename = src/flip/routes/static.ts → flip-ui is at packages/cli/flip-ui/dist
const isBundled = path.basename(__filename) === 'index.js';
const distPath = isBundled
    ? path.resolve(__dirname, 'flip-ui/dist')
    : path.resolve(__dirname, '../../../flip-ui/dist');
```

**Justification:**
- 번들 후 `import.meta.url`이 `dist/index.js`를 가리키므로, 파일명으로 번들 여부를 감지
- 번들된 경우: `dist/flip-ui/dist` 경로 사용
- 개발 모드: 기존 `../../../flip-ui/dist` 경로 유지

## Build Verification

```bash
npm run build
# ✓ tsc 성공
# ✓ esbuild 번들링 성공
# ✓ flip-ui 빌드 성공
```

번들된 코드 확인:
```javascript
// dist/index.js:1109-1110
const isBundled = path7.basename(__filename) === "index.js";
const distPath = isBundled ? path7.resolve(__dirname, "flip-ui/dist") : path7.resolve(__dirname, "../../../flip-ui/dist");
```

## Test Coverage

이 변경은 CLI 도구의 정적 파일 서빙 경로에만 영향을 미치며, 기존 테스트 스위트에 해당하는 테스트가 없음.

**수동 검증 필요:**
1. 개발 모드 (`npm run dev:flip`) - Vite 개발 서버 사용
2. 번들 모드 (전역 설치 후 `csq flip`) - 정적 파일 서빙 확인

## Side Effects

- 없음. 기존 동작 유지하면서 번들 환경에서만 경로 계산 방식 변경
