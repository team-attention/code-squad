# Spec: HN Feed Waiting Experience

**Slug**: `sidecar-2025-12-07-hn-feed-waiting-experience`
**Created**: 2025-12-07
**Status**: Draft

## Overview

빈 화면을 의미 있는 대기 경험으로 전환: AI 작업 중 대기 애니메이션과 HN 피드를 통합하여 컨텍스트 전환 없이 자연스러운 대기 시간을 제공한다. 파일 변경 감지 시 자동으로 diff view로 전환되며, 수동 토글로 피드와 diff 사이를 전환할 수 있다.

## Problem Statement

현재 Sidecar 패널의 empty state는 사용자에게 의미 있는 정보를 제공하지 못한다:

1. **빈 화면의 의미 전달 부재**: AI가 작업 중인지, 아무 일도 일어나지 않는지 구분할 수 없다
2. **대기 시간 활용 불가**: AI 작업 대기 중 할 일이 없어 다른 작업으로 컨텍스트 스위칭이 발생한다
3. **외부 브라우저 이동**: HN 링크 클릭 시 외부 브라우저로 이동하여 화면 분할과 작업 흐름이 끊긴다
4. **정적인 피드 UI**: 현재 "게시판" 스타일의 정적 목록은 가볍게 훑어보기에 적합하지 않다

**Root Cause**: 빈 화면이 "의미 없는 상태"로 인식되며, 피드가 대기 경험과 분리되어 있다.

## Requirements

### 1. Waiting State Display

AI 세션이 활성화되었지만 아직 파일 변경이 없는 경우, 대기 상태를 시각적으로 표현:

- **애니메이션**: 부드러운 회전 애니메이션 (◐ ◓ ◑ ◒) 또는 pulse 효과
- **메시지**: "Watching for changes..." 등의 안내 문구
- **구분선**: "Meanwhile" 등의 시각적 구분을 통해 피드와 자연스럽게 연결

### 2. Integrated HN Feed

대기 화면 하단에 HN 피드를 통합하여 읽을거리 제공:

- **미니멀 레이아웃**: 제목 중심, 간결한 메타정보 (점수, 댓글 수)
- **스크롤 가능**: 여러 아티클을 스크롤하며 훑어볼 수 있음
- **클릭 가능**: 제목 클릭 시 WebView로 열기 (외부 브라우저 X)
- **기존 기능 재사용**: `FetchHNStoriesUseCase`, `HNStory` entity 활용

### 3. WebView Internal Navigation

HN 링크를 Sidecar 패널 내 WebView에서 열기:

- **컨텍스트 유지**: 외부 브라우저로 이동하지 않고 패널 안에서 표시
- **뒤로가기**: WebView에서 뒤로가기 버튼으로 피드로 복귀
- **VSCode 통합**: `vscode.WebviewPanel` 또는 embedded iframe 활용

### 4. Auto-Transition to Diff View

파일 변경 감지 시 자동으로 diff view로 전환:

- **감지 메커니즘**: 기존 `FileWatchController`의 파일 변경 이벤트 활용
- **즉시 전환**: 첫 파일 변경 시 대기 화면 → diff view
- **상태 전환**: `PanelState.diff`가 `null`에서 `DiffDisplayState`로 변경

### 5. Manual Toggle Between Feed and Diff

파일이 있는 상태에서 수동으로 피드 ↔ diff 전환:

- **토글 버튼**: Diff view 헤더에 "📰 Feed" 버튼 추가
- **양방향 전환**: Feed 버튼 클릭 시 → 대기 화면 (피드 표시), 파일 선택 시 → diff view
- **상태 유지**: 현재 선택된 파일 정보는 유지

## Use Cases

### UC-1: Display Waiting Screen with HN Feed

- **Actor**: AI 작업을 시작한 개발자
- **Trigger**: AI 세션이 활성화되었지만 아직 파일 변경이 없는 상태
- **Flow**:
  1. AI 세션이 시작되고 `aiStatus.active = true`
  2. `sessionFiles`가 비어있거나 `diff === null`인 경우 대기 화면 표시
  3. 시스템이 대기 애니메이션 렌더링 (회전 또는 pulse)
  4. 시스템이 `FetchHNStoriesUseCase`를 호출하여 HN 피드 로드
  5. 피드가 로드되면 아티클 목록을 대기 화면 하단에 표시
  6. 개발자가 스크롤하며 아티클 제목을 훑어봄
- **Business Rules**:
  - AI 세션이 비활성 상태이면 대기 화면을 표시하지 않음
  - 피드 로딩 실패 시 에러 메시지 대신 캐시된 데이터 또는 빈 상태 표시
  - 피드는 5분 캐시 (기존 `FetchHNStoriesUseCase` 로직 유지)
- **Location**:
  - UI: `adapters/inbound/ui/webview/script.ts` (waiting screen rendering)
  - State: `adapters/inbound/ui/PanelStateManager.ts` (state management)

### UC-2: Open HN Link in WebView

- **Actor**: 대기 중 피드를 읽는 개발자
- **Trigger**: HN 아티클 제목 클릭
- **Flow**:
  1. 개발자가 HN 아티클 제목 클릭
  2. Webview가 `openHNStory` 메시지를 extension으로 전송
  3. Extension이 WebView panel을 생성하거나 iframe을 로드
  4. 아티클 URL이 WebView 안에서 표시됨
  5. 개발자가 뒤로가기 버튼 또는 닫기로 피드로 복귀
- **Business Rules**:
  - HN 토론 링크(discussionUrl)는 WebView에서 열기
  - 아티클 원문 URL(story.url)도 WebView에서 열기
  - WebView 내에서 외부 링크 클릭 시 처리 방법 정의 필요
- **Location**:
  - Message handler: `adapters/inbound/ui/SidecarPanelAdapter.ts`
  - WebView rendering: VSCode WebviewPanel API

### UC-3: Auto-Transition from Waiting to Diff View

- **Actor**: AI 작업 중인 개발자
- **Trigger**: 파일 변경 감지 (`FileWatchController.handleFileChange`)
- **Flow**:
  1. AI가 파일을 수정하여 `FileWatchController`가 변경 이벤트 수신
  2. 시스템이 `sessionFiles`에 변경된 파일 추가
  3. 시스템이 `GenerateDiffUseCase` 호출하여 diff 생성
  4. `PanelState.diff`가 업데이트되어 `DiffDisplayState` 설정
  5. Webview가 대기 화면에서 diff view로 자동 전환
  6. 개발자가 변경된 코드 리뷰 시작
- **Business Rules**:
  - 첫 번째 파일 변경 시에만 자동 전환
  - 이미 diff view가 표시된 상태에서 다른 파일 변경 시에는 파일 목록만 업데이트
  - 자동 전환 후에도 토글로 피드로 돌아갈 수 있음
- **Location**:
  - File change handling: `adapters/inbound/controllers/FileWatchController.ts`
  - State update: `adapters/inbound/ui/PanelStateManager.ts`
  - UI transition: `adapters/inbound/ui/webview/script.ts`

### UC-4: Toggle Between Feed and Diff View

- **Actor**: 리뷰 중 잠시 피드를 확인하고 싶은 개발자
- **Trigger**: Diff view 헤더의 "📰 Feed" 버튼 클릭
- **Flow**:
  1. 개발자가 diff view에서 "📰 Feed" 버튼 클릭
  2. Webview가 `toggleFeed` 메시지를 extension으로 전송
  3. Extension이 `PanelState.selectedFile`을 임시 저장하고 `null`로 설정
  4. UI가 대기 화면 (피드 표시)로 전환
  5. 개발자가 파일 목록에서 파일 클릭 시 다시 diff view로 전환
- **Business Rules**:
  - 토글은 현재 선택된 파일 정보를 임시 저장
  - 피드 표시 중에도 파일 목록은 계속 표시
  - 파일 선택 시 자동으로 diff view로 복귀
- **Location**:
  - Message handler: `adapters/inbound/ui/SidecarPanelAdapter.ts`
  - State management: `adapters/inbound/ui/PanelStateManager.ts`
  - UI rendering: `adapters/inbound/ui/webview/script.ts`

### UC-5: Refresh HN Feed

- **Actor**: 대기 화면을 보는 개발자
- **Trigger**: "Refresh" 버튼 클릭 또는 5분 캐시 만료
- **Flow**:
  1. 개발자가 피드 영역의 "↻ Refresh" 버튼 클릭
  2. Webview가 `refreshHNFeed` 메시지 전송
  3. Extension이 `FetchHNStoriesUseCase.execute(forceRefresh: true)` 호출
  4. 시스템이 HN API에서 최신 스토리 가져옴
  5. `PanelState.hnStories` 업데이트
  6. UI가 새로운 아티클 목록 표시
- **Business Rules**:
  - 수동 새로고침은 캐시를 무시하고 강제로 API 호출
  - 자동 새로고침은 5분 캐시 만료 후 다음 피드 표시 시
  - 로딩 중에는 "Loading..." 상태 표시
- **Location**:
  - Use case: `application/useCases/FetchHNStoriesUseCase.ts` (기존 재사용)
  - Message handler: `adapters/inbound/ui/SidecarPanelAdapter.ts`

## UI/UX Design

### Waiting Screen (Empty State)

```
┌─────────────────────────────────────┐
│                                     │
│         ◐ ◓ ◑ ◒                    │  ← Rotating animation
│   Watching for changes...           │
│                                     │
│   ──────── Meanwhile ────────       │
│                                     │
│   ┌─────────────────────────────┐  │
│   │ HN Story Title 1         → │  │  ← Click opens WebView
│   │ 142 pts · 52 comments       │  │
│   │ example.com · 2h ago        │  │
│   └─────────────────────────────┘  │
│                                     │
│   ┌─────────────────────────────┐  │
│   │ HN Story Title 2         → │  │
│   │ 89 pts · 23 comments        │  │
│   │ github.com · 4h ago         │  │
│   └─────────────────────────────┘  │
│                                     │
│   ┌─────────────────────────────┐  │
│   │ HN Story Title 3         → │  │
│   │ 201 pts · 87 comments       │  │
│   │ techblog.io · 6h ago        │  │
│   └─────────────────────────────┘  │
│                                     │
│           ↻ Refresh                 │  ← Refresh button
│                                     │
└─────────────────────────────────────┘
```

### Diff View with Feed Toggle

```
┌─────────────────────────────────────┐
│  src/index.ts           [📰 Feed]  │  ← Toggle button
├─────────────────────────────────────┤
│  @@ -10,6 +10,8 @@                 │
│    10 │   function getData() {      │
│    11 │     const result = fetch(); │
│  + 12 │+    await process();        │
│    13 │     return data;            │
│       │                             │
└─────────────────────────────────────┘
```

### WebView Article Display

```
┌─────────────────────────────────────┐
│  ← Back to Feed              ✕     │  ← Navigation
├─────────────────────────────────────┤
│                                     │
│  [Article content rendered here]    │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

## Technical Considerations

### Architecture

```
domain/
  entities/
    HNStory.ts                    # 기존 재사용

application/
  useCases/
    FetchHNStoriesUseCase.ts      # 기존 재사용
  ports/
    outbound/
      PanelState.ts               # hnStories, hnFeedStatus 이미 존재

adapters/
  inbound/
    ui/
      SidecarPanelAdapter.ts      # 메시지 핸들러 추가:
                                  #   - openHNStory
                                  #   - toggleFeed
                                  #   - refreshHNFeed
      PanelStateManager.ts        # State update 로직
      webview/
        script.ts                 # UI 렌더링 로직 추가:
                                  #   - renderWaitingScreen()
                                  #   - renderHNFeed()
                                  #   - openWebView()
```

### State Management

기존 `PanelState` 활용:

```typescript
interface PanelState {
  // 기존 필드들...
  sessionFiles: FileInfo[];
  diff: DiffDisplayState | null;

  // HN Feed 관련 (이미 존재)
  hnStories: HNStoryInfo[];
  hnFeedStatus: HNFeedStatus;      // 'idle' | 'loading' | 'error' | 'success'
  hnFeedError?: string;
  hnLastFetchTime?: number;
}
```

**Waiting Screen 표시 조건**:
```typescript
const shouldShowWaitingScreen =
  state.aiStatus.active &&           // AI 세션 활성
  (state.sessionFiles.length === 0 || // 파일 없음
   state.diff === null);              // 또는 diff 없음
```

### WebView Integration

**Option 1: VSCode WebviewPanel** (권장)
- 별도 패널로 열기
- 장점: 독립적 탐색, 뒤로가기 기능
- 단점: 화면 전환 느낌

**Option 2: Embedded Iframe**
- Sidecar 패널 내 iframe으로 표시
- 장점: 통합된 느낌
- 단점: iframe 제약 (CORS, 일부 사이트 차단)

**선택**: Option 1 (WebviewPanel) - 안정적이고 기능 완전

### Performance Considerations

1. **피드 로딩**: 기존 5분 캐시 유지, 백그라운드 새로고침
2. **애니메이션**: CSS animation 사용 (JS 타이머 X)
3. **자동 전환**: 기존 파일 감지 이벤트 재사용 (새로운 watcher 추가 X)

### Integration with Existing Features

| 기존 기능 | 통합 방식 |
|---------|----------|
| FileWatchController | 파일 변경 감지 → 자동 전환 트리거 |
| FetchHNStoriesUseCase | 피드 데이터 로딩 재사용 |
| PanelState | hnStories, hnFeedStatus 필드 활용 |
| Comment Management | Diff view와 독립적, 영향 없음 |

## Acceptance Criteria

- [ ] AI 세션 활성 + 파일 없음 상태에서 대기 화면 표시
- [ ] 대기 화면에 회전 애니메이션 표시
- [ ] 대기 화면에 HN 피드 목록 표시 (최대 20개)
- [ ] HN 아티클 제목 클릭 시 WebView에서 열림
- [ ] WebView에서 뒤로가기로 피드로 복귀
- [ ] 첫 파일 변경 시 대기 화면 → diff view 자동 전환
- [ ] Diff view에서 "📰 Feed" 버튼으로 피드 표시
- [ ] 피드 표시 중 파일 선택 시 diff view로 전환
- [ ] 피드 새로고침 버튼 동작
- [ ] 피드 로딩 실패 시 에러 처리 (캐시 fallback)

## Out of Scope

- 다른 피드 소스 추가 (Reddit, Twitter 등) - 추후 확장
- 피드 카드 상세 정보 (본문 미리보기, 썸네일) - v1은 미니멀
- 피드 필터링/검색 기능
- WebView 내 북마크/공유 기능
- 피드 읽은/안읽은 상태 추적
- 여러 WebView 동시 열기 (하나만 열림)

## Open Questions

1. **WebView 위치**: 별도 패널 vs Sidecar 내 iframe?
   - **결정**: 별도 WebviewPanel (안정성, 뒤로가기 지원)

2. **애니메이션 스타일**: 회전 vs pulse vs progress bar?
   - **결정**: 회전 애니메이션 (◐ ◓ ◑ ◒) - 부드럽고 덜 주목

3. **피드 갯수**: 몇 개 표시?
   - **결정**: 기존 20개 유지 (스크롤 가능)

4. **토글 버튼 위치**: Diff 헤더 vs 사이드바 vs 별도 버튼?
   - **결정**: Diff 헤더 오른쪽 (파일명 옆)

5. **자동 전환 타이밍**: 즉시 vs 약간 딜레이?
   - **결정**: 즉시 전환 (사용자 대기 최소화)

## References

- Brainstorm: `/Users/eatnug/Workspace/sidecar/docs/brainstorms/hn-feed-improvement.md`
- Existing Use Cases: `application/useCases/FetchHNStoriesUseCase.ts`
- State Management: `application/ports/outbound/PanelState.ts`
- File Watching: `adapters/inbound/controllers/FileWatchController.ts`
