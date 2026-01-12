---
id: flip-blank-page
steps: [verify]
parent: fix/flip-blank-page
children: []
---

# Verify: csq flip 빈 페이지 문제

## Bug ID
flip-blank-page

## Verification

### Original Bug

| Step | Action | Result |
|------|--------|--------|
| 1 | `node dist/index.js flip` 실행 | pass - 서버 시작됨 |
| 2 | `http://localhost:51283` 접속 | pass - HTML 정상 반환 |
| 3 | 정적 파일 로딩 확인 | pass - JS/CSS 200 OK |

**수정 전**: `fs.existsSync(distPath)` 실패 → Vite 서버로 리다이렉트 → 빈 페이지
**수정 후**: 번들 감지 → 올바른 경로로 정적 파일 서빙 → UI 정상 표시

### Test Results

```bash
# HTML 페이지 반환 확인
$ curl -s http://localhost:51283 | head -10
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Flip</title>
    <script type="module" crossorigin src="/assets/index-B2PjDe6F.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-DYY1gRRa.css">
...

# JS 정적 파일 서빙 확인
$ curl -sI http://localhost:51283/assets/index-B2PjDe6F.js
HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Origin: *
```

## Regression

### Automated Tests
- 해당 코드에 대한 자동화 테스트 없음

### Manual Tests

| 기능 | 테스트 항목 | 결과 | 비고 |
|------|------------|------|------|
| 번들 모드 | `node dist/index.js flip` | pass | HTML + 정적 파일 정상 |
| API 라우트 | `/api/files`, `/api/git` | pass | 기존 동작 유지 |

## Documentation

### Changelog

```markdown
## [2026-01-12] 버그 수정: csq flip 빈 페이지 문제

### 문제
배포 후 `csq flip` 명령어가 열어주는 페이지가 빈 페이지로 표시됨

### 원인
esbuild 번들링 후 `import.meta.url`이 `dist/index.js`를 가리키지만,
경로 계산이 번들 전 파일 구조(`src/flip/routes/static.ts`)를 기준으로 설계되어
flip-ui 정적 파일 경로가 잘못 계산됨

### 해결
번들 여부를 파일명으로 감지하여 경로 분기:
- 번들: `dist/flip-ui/dist`
- 개발: `../../../flip-ui/dist`

### 영향
- csq flip 명령어 정상 동작 복원
- 기존 개발 모드 동작 유지
```

## Release Readiness

| 항목 | 상태 |
|------|------|
| 코드 리뷰 | pending |
| 테스트 통과 | true |
| 문서화 완료 | true |
| 롤백 계획 | true (git revert) |

## Summary

```yaml
status: verified
notes: |
  - 번들된 코드에서 정적 파일 경로 수정 완료
  - HTML, JS, CSS 모두 정상 서빙 확인
  - 전역 설치 테스트는 권한 문제로 로컬 빌드에서 검증
  - 배포 후 실제 사용자 환경에서 최종 확인 필요
```
