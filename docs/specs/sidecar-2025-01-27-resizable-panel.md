# Spec: Resizable Panel

**Slug**: `sidecar-2025-01-27-resizable-panel`
**Created**: 2025-01-27

## Summary

사이드바(파일 목록 + 코멘트 영역)와 메인 콘텐츠(Diff 뷰어) 사이의 경계를 드래그하여 크기를 조절할 수 있는 기능 추가.

## Requirements

### Functional Requirements

1. **드래그 핸들**: 사이드바와 메인 콘텐츠 사이에 드래그 가능한 resizer 요소 표시
2. **실시간 크기 조절**: 드래그 중 실시간으로 사이드바 너비 변경
3. **제한값 적용**:
   - 최소 너비: 150px
   - 최대 너비: 600px
4. **기존 토글 유지**: 사이드바 접기/펼치기 버튼은 그대로 동작
5. **접힌 상태에서 비활성화**: 사이드바가 접힌 상태에서는 리사이저 비활성화
6. **접힌 상태에서 완전 숨김**: 사이드바 접힘 시 빈 공간 없이 메인 콘텐츠가 전체 너비 차지 (기존 44px 여백 제거)

### Non-Functional Requirements

1. **시각적 피드백**: 호버 시 리사이저 강조 표시
2. **커서 변경**: 리사이저 위에서 `col-resize` 커서 표시
3. **드래그 중 선택 방지**: 드래그 중 텍스트 선택 방지

## Technical Design

### Affected Layer

- **Adapters Layer**: `src/adapters/presenters/SidecarPanelAdapter.ts`

### Implementation Details

#### 1. HTML 변경

```html
<!-- 메인 콘텐츠와 사이드바 사이에 추가 -->
<div class="resizer" id="panel-resizer"></div>
```

#### 2. CSS 변경

```css
body {
  /* 기존 grid에 resizer 영역 추가 */
  grid-template-columns: 1fr 4px 320px;
  grid-template-areas: "main resizer sidebar";
}

.resizer {
  grid-area: resizer;
  background: var(--vscode-panel-border);
  cursor: col-resize;
  transition: background 0.2s;
}

.resizer:hover,
.resizer.dragging {
  background: var(--vscode-focusBorder, #007acc);
}

body.resizing {
  cursor: col-resize;
  user-select: none;
}

body.sidebar-collapsed {
  grid-template-columns: 1fr 0 0;  /* 사이드바 완전 숨김 */
}

body.sidebar-collapsed .resizer {
  display: none;
}

body.sidebar-collapsed .sidebar {
  display: none;
}
```

#### 3. JavaScript 변경

```javascript
const resizer = document.getElementById('panel-resizer');
let isResizing = false;
let sidebarWidth = 320;

resizer.addEventListener('mousedown', (e) => {
  if (bodyEl.classList.contains('sidebar-collapsed')) return;
  isResizing = true;
  bodyEl.classList.add('resizing');
  resizer.classList.add('dragging');
});

document.addEventListener('mousemove', (e) => {
  if (!isResizing) return;
  const newWidth = window.innerWidth - e.clientX;
  const clampedWidth = Math.max(150, Math.min(600, newWidth));
  sidebarWidth = clampedWidth;
  bodyEl.style.gridTemplateColumns = `1fr 4px ${clampedWidth}px`;
});

document.addEventListener('mouseup', () => {
  if (!isResizing) return;
  isResizing = false;
  bodyEl.classList.remove('resizing');
  resizer.classList.remove('dragging');
});
```

## Success Criteria

1. [ ] 사이드바 경계를 드래그하여 크기 조절 가능
2. [ ] 최소 150px, 최대 600px 제한 동작
3. [ ] 호버/드래그 시 시각적 피드백 표시
4. [ ] 기존 토글 버튼 정상 동작
5. [ ] 접힌 상태에서 리사이저 비활성화
6. [ ] 접힌 상태에서 사이드바 완전 숨김 (빈 공간 없음)

## Out of Scope

- 크기 값 저장/복원 (설정 영속성)
- 키보드로 크기 조절
- 수직 방향 리사이징
