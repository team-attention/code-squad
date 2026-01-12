---
id: flip-blank-page
steps: [root-cause, fix, verify]
parent: clarify/flip-blank-page
children: [fix/flip-blank-page]
---

# Root Cause Analysis: csq flip 빈 페이지 문제

## Trace

### 코드 흐름 분석

```
csq flip 실행
    ↓
packages/cli/src/flip/index.ts:runFlip()
    ↓ Server 생성 및 실행
packages/cli/src/flip/server/Server.ts:run()
    ↓ 정적 파일 라우터 등록
packages/cli/src/flip/routes/static.ts:createStaticRouter()
    ↓ distPath 계산
path.resolve(__dirname, '../../../flip-ui/dist')  ← 문제 지점
    ↓ fs.existsSync(distPath) 실패
개발 모드로 fallback → localhost:5173으로 리다이렉트
    ↓ Vite 서버 없음
빈 페이지
```

### 관찰

| 위치 | 관찰 내용 |
|------|-----------|
| `static.ts:12-13` | `fileURLToPath(import.meta.url)` 사용 |
| `static.ts:18` | `'../../../flip-ui/dist'` - 상대 경로 3레벨 상위 |
| 번들된 `dist/index.js:1107` | 동일한 `import.meta.url` 사용 |
| 번들된 `dist/index.js:1109` | 동일한 `'../../../flip-ui/dist'` 경로 |

## Five Whys

1. **왜 빈 페이지가 표시되는가?**
   - `fs.existsSync(distPath)`가 false를 반환하여 Vite 개발 서버(5173)로 리다이렉트되지만, Vite 서버가 실행되지 않음

2. **왜 distPath가 존재하지 않는가?**
   - 계산된 경로가 실제 flip-ui/dist 위치와 다름

3. **왜 경로가 다른가?**
   - 번들 후 `import.meta.url`이 `dist/index.js`를 가리키지만, 경로 계산은 `dist/flip/routes/static.js` 기준으로 설계됨

4. **왜 이런 설계가 되었는가?**
   - esbuild 번들링 시 모든 코드가 `dist/index.js`로 합쳐지지만, `import.meta.url`이 번들 파일을 가리킨다는 점을 고려하지 않음

5. **왜 개발 중에는 발견되지 않았는가?**
   - 개발 모드(`tsx` 실행)에서는 `src/flip/routes/static.ts` 위치에서 경로가 정상 작동

## Root Cause Summary

**번들링 후 `import.meta.url` 기반 경로 계산 오류**

- 개발 모드: `__dirname = src/flip/routes` → `../../../flip-ui/dist` = `packages/cli/flip-ui/dist` ✓
- 번들 모드: `__dirname = dist` → `../../../flip-ui/dist` = 존재하지 않는 경로 ✗

## Impact Assessment

### 영향받는 기능
| 기능 | 영향도 | 설명 |
|------|--------|------|
| csq flip | 완전 불능 | 모든 사용자가 flip UI 사용 불가 |
| csq flip serve | 완전 불능 | 동일 |

### 영향받는 사용자
- 전역 설치된 csq를 사용하는 모든 사용자

## Fix Options

| Option | 설명 | 장점 | 단점 | 위험도 |
|--------|------|------|------|--------|
| **A: 번들 감지** | `index.js` 파일명 여부로 번들 환경 감지 후 경로 분기 | 명시적, 이해하기 쉬움 | 파일명 의존성 | 낮음 |
| **B: 디렉토리 탐색** | flip-ui 폴더를 상위/현재 디렉토리에서 순차 탐색 | 유연함 | 성능 약간 저하 | 낮음 |
| **C: 빌드 시 경로 주입** | esbuild 빌드 시 절대 경로를 define으로 주입 | 런타임 오버헤드 없음 | 빌드 설정 복잡 | 중간 |

## Recommendation

**Option A: 번들 감지** 권장

이유:
1. 코드 변경이 최소화됨 (static.ts만 수정)
2. 빌드 프로세스 변경 불필요
3. 명시적인 조건 분기로 디버깅 용이
4. 번들 후 구조가 `dist/index.js` + `dist/flip-ui/dist/`로 명확

### 수정 방안

```typescript
// static.ts
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 번들 여부 감지: index.js에서 실행 중이면 번들된 상태
const isBundled = path.basename(__filename) === 'index.js';

const distPath = isBundled
    ? path.resolve(__dirname, 'flip-ui/dist')        // 번들: dist/flip-ui/dist
    : path.resolve(__dirname, '../../../flip-ui/dist'); // 개발: src → packages/cli/flip-ui/dist
```
