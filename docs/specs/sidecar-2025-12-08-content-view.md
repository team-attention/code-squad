# Content View Integration

## Summary
Enable HN articles and external content to open as an integrated view within the main Sidecar panel, at the same hierarchy level as the diff viewer, instead of opening in a separate browser webview panel.

## Background
Currently, clicking on Hacker News stories in the waiting screen opens content in a separate webview panel (`sidecarArticle`) at `ViewColumn.Two`. This creates a disjointed experience where:
- Content appears as a separate, independent panel
- Users lose the contextual relationship between the content and the review workflow
- The content view doesn't integrate with Sidecar's unified interface

The desired behavior is to have content views (HN articles, external links) open within Sidecar's main content area (`.main-content`), similar to how diff, scope, and preview views work.

## Requirements

### Functional Requirements

1. **FR-1**: 콘텐츠 뷰를 메인 패널의 `.main-content` 영역에 표시
   - HN 스토리 링크 클릭 시 diff viewer와 같은 영역에 표시
   - 별도의 webview panel 생성하지 않음

2. **FR-2**: 콘텐츠 뷰와 diff 뷰 간 전환 기능
   - 콘텐츠 뷰에서 파일을 선택하면 diff 뷰로 전환
   - 콘텐츠 뷰 표시 중에도 파일 목록 접근 가능

3. **FR-3**: 콘텐츠 뷰 헤더 및 네비게이션
   - 헤더에 콘텐츠 제목 표시
   - 뒤로가기 버튼으로 이전 상태로 복귀
   - 외부 브라우저에서 열기 옵션

4. **FR-4**: 콘텐츠 표시 방식
   - iframe을 통한 외부 URL 렌더링
   - 로딩 상태 표시
   - 오류 처리 (로드 실패 시)

### Non-Functional Requirements

1. **NFR-1**: Diff 뷰와 동일한 UI 계층 구조 유지
   - `.main-content` 내부의 `#diff-viewer` 영역 재사용
   - 기존 헤더 (`#viewer-header`) 및 툴바 구조 활용

2. **NFR-2**: 상태 관리 일관성
   - `PanelState`에 콘텐츠 뷰 상태 추가
   - 뷰 전환 시 상태 동기화

3. **NFR-3**: 메모리 효율성
   - 별도 webview panel 생성하지 않음으로써 메모리 사용 감소
   - 단일 webview 내에서 뷰 전환

## Use Cases

### UC-1: OpenContentView
| Aspect | Description |
|--------|-------------|
| **Actor** | 사용자 |
| **Trigger** | HN 스토리 링크 또는 외부 콘텐츠 링크 클릭 |
| **Precondition** | Sidecar 패널이 열려 있음 |
| **Flow** | 1. 사용자가 HN 피드에서 스토리 클릭<br>2. 시스템이 콘텐츠 뷰로 전환<br>3. 메인 콘텐츠 영역에 URL이 iframe으로 로드됨<br>4. 헤더에 콘텐츠 제목 및 네비게이션 버튼 표시 |
| **Postcondition** | 콘텐츠 뷰가 `.main-content` 영역에 표시되며, 파일 목록은 여전히 접근 가능 |
| **Business Rules** | - 콘텐츠 뷰는 diff/scope/preview 뷰와 상호 배타적<br>- 파일 선택 시 자동으로 diff 뷰로 전환 |
| **Location** | `application/useCases/OpenContentViewUseCase.ts` |

### UC-2: CloseContentView
| Aspect | Description |
|--------|-------------|
| **Actor** | 사용자 |
| **Trigger** | 콘텐츠 뷰에서 뒤로가기 버튼 클릭 또는 파일 선택 |
| **Precondition** | 콘텐츠 뷰가 표시되어 있음 |
| **Flow** | 1. 사용자가 뒤로가기 버튼 클릭 또는 파일 선택<br>2. 시스템이 콘텐츠 뷰 상태를 클리어<br>3. 이전 상태로 복귀 (diff 뷰 또는 placeholder) |
| **Postcondition** | 콘텐츠 뷰가 닫히고 이전 뷰가 표시됨 |
| **Business Rules** | - 파일 선택 시 자동으로 콘텐츠 뷰 닫힘<br>- 뒤로가기 시 마지막 선택 파일의 diff 뷰로 복귀 |
| **Location** | `application/useCases/CloseContentViewUseCase.ts` |

## UI/UX

### 현재 구조
```
Sidecar Panel (ViewColumn.Two)
├── .sidebar (파일 목록, 코멘트)
├── .resizer
└── .main-content
    ├── .diff-header
    ├── .diff-toolbar
    └── #diff-viewer (diff/scope/preview 뷰)

별도 Panel (ViewColumn.Two)
└── Article Webview (독립된 패널)
```

### 변경 후 구조
```
Sidecar Panel (ViewColumn.Two)
├── .sidebar (파일 목록, 코멘트)
├── .resizer
└── .main-content
    ├── .diff-header (콘텐츠 제목 표시)
    ├── .diff-toolbar (네비게이션 버튼)
    └── #diff-viewer
        └── .content-view (새로 추가)
            ├── .content-iframe
            └── .content-loading (로딩 상태)
```

### 콘텐츠 뷰 UI 요소
```
┌─────────────────────────────────────────┐
│ 📄 [Title]                    [← Back] │ ← Header
├─────────────────────────────────────────┤
│                                         │
│         [iframe content]                │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

## Out of Scope

1. 콘텐츠 내 텍스트 검색 기능
2. 다중 콘텐츠 탭 관리 (히스토리 스택)
3. 콘텐츠 캐싱 또는 오프라인 뷰
4. 콘텐츠에 대한 코멘트 기능
5. Reader mode 또는 simplified view

## Open Questions

1. **Q**: 콘텐츠 뷰 상태를 `diffViewMode`로 관리할 것인가, 별도 상태로 관리할 것인가?
   - **Option A**: `diffViewMode: 'diff' | 'scope' | 'preview' | 'content'`
   - **Option B**: 별도 `contentViewState: { visible: boolean, url: string, title: string }` 추가
   - **Recommendation**: Option B - 콘텐츠 뷰는 파일과 독립적인 개념이므로 별도 상태 관리가 명확함

2. **Q**: 콘텐츠 뷰 표시 중 파일 선택 시 동작?
   - **Option A**: 즉시 diff 뷰로 전환 (콘텐츠 뷰 자동 닫힘)
   - **Option B**: 확인 다이얼로그 후 전환
   - **Recommendation**: Option A - 자연스러운 워크플로우

3. **Q**: 기존 `openArticleInWebview()` 메서드는 어떻게 처리?
   - **Recommendation**: Deprecated 처리하고 새로운 콘텐츠 뷰 시스템으로 마이그레이션. 하위 호환성 필요 시 유지하되 내부적으로 새 시스템 사용
