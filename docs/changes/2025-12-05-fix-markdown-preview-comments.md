# Fix: Markdown Preview Comments

## Problem
마크다운 프리뷰 영역에서:
1. 검색 키워드 하이라이팅 안됨
2. 인라인 코멘트 미표시
3. 코멘트 추가/수정/삭제 시 스크롤 최상단으로 이동
4. 사이드바 코멘트 클릭 시 프리뷰 모드에서 스크롤 안됨
5. 코멘트 영역 시각적 구분 어려움
6. 파일 간 코멘트 상태 공유 문제
7. diff 뷰 코멘트 기본 접힘 상태
8. 코멘트 박스 스타일 문제 (패딩, 정렬)

## Root Cause
1. 프리뷰 렌더링 후 `onFileChange()` 미호출
2. 프리뷰용 인라인 코멘트 렌더링 로직 부재
3. 스크롤 위치 저장/복원 로직 부재
4. `scrollToLineInDiff()`가 프리뷰 모드 미지원
5. 코멘트 범위 표시 UI 부재
6. 프리뷰 모드에서 파일별 코멘트 필터링 누락
7. `inline-comment-row`에 `collapsed` 클래스 기본 적용
8. `.markdown-preview` 스타일 상속 및 HTML 템플릿 공백 문제

## Solution

### 검색 하이라이팅 & 인라인 코멘트
- `renderMarkdownPreview()` 후 `onFileChange()` 호출 추가
- 프리뷰용 코멘트 렌더링 로직 구현 (`renderFullMarkdownWithHighlights`)

### 스크롤 위치 유지
- `saveScrollPosition()` 헬퍼 함수 추가
- `getScrollableElement()` - 프리뷰/diff 모드별 스크롤 컨테이너 반환
- 코멘트 추가/수정/삭제 시 스크롤 위치 저장 및 복원

### 사이드바 코멘트 클릭 스크롤
- `scrollToLineInDiff()`에 프리뷰 모드 지원 추가
- `.diff-block` 요소 탐색 및 스크롤

### 코멘트 범위 시각적 표시
- `.comment-gutter-indicators` 컨테이너로 여러 색상 바 렌더링
- 사이드바 코멘트에도 색상 인디케이터 추가

### 파일별 코멘트 필터링
- 프리뷰 모드에서 `comments.filter(c => c.file === diff.file)` 적용

### diff 뷰 코멘트 기본 열림
- `inline-comment-row`에서 `collapsed` 클래스 제거

### 코멘트 박스 스타일
- `.preview-comment-body`에 명시적 스타일 적용 (`!important`)
- `white-space: pre-line` 사용 (줄바꿈 유지, HTML 공백 무시)
- HTML 템플릿에서 불필요한 줄바꿈 제거

## Files Changed
- `src/adapters/inbound/ui/webview/script.ts`
  - 스크롤 위치 저장/복원 로직
  - 프리뷰 모드 코멘트 렌더링
  - 파일별 코멘트 필터링
  - 사이드바 코멘트 색상
- `src/adapters/inbound/ui/webview/styles.ts`
  - 프리뷰 코멘트 스타일
  - 거터 인디케이터 스타일
  - 사이드바 코멘트 색상

## Validation
- [x] Compile 성공
- [x] 검색 하이라이팅 동작
- [x] 인라인 코멘트 표시
- [x] 스크롤 위치 유지
- [x] 사이드바 클릭 스크롤
- [x] 코멘트 범위 표시
- [x] 파일별 코멘트 분리
- [x] diff 뷰 코멘트 기본 열림
- [x] 코멘트 박스 스타일 정상
