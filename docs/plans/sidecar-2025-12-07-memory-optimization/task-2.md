# Task 2: Limit Global Collection Sizes

## Goal

전역 컬렉션(`collapsedFolders`, `diffSearchMatches`, `scopedDiffHighlightMap`)에 크기 제한 구현.

## Files to Modify

- `src/adapters/inbound/ui/webview/script.ts`

## Technical Approach

### 1. collapsedFolders 크기 제한 (1000개)

**Before**:
```typescript
const collapsedFolders = new Set<string>();
collapsedFolders.add(folderPath);
```

**After**:
```typescript
const MAX_COLLAPSED_FOLDERS = 1000;
const collapsedFolders = new Set<string>();

function addCollapsedFolder(folderPath: string) {
  if (collapsedFolders.size >= MAX_COLLAPSED_FOLDERS) {
    // Remove oldest (first) entry
    const first = collapsedFolders.values().next().value;
    if (first) collapsedFolders.delete(first);
  }
  collapsedFolders.add(folderPath);
}
```

### 2. diffSearchMatches 크기 제한 (500개)

**Before**:
```typescript
let diffSearchMatches: SearchMatch[] = [];
diffSearchMatches.push(match);
```

**After**:
```typescript
const MAX_SEARCH_MATCHES = 500;
let diffSearchMatches: SearchMatch[] = [];

// 검색 시작 시 항상 초기화
function startNewSearch() {
  diffSearchMatches = [];
}

function addSearchMatch(match: SearchMatch) {
  if (diffSearchMatches.length >= MAX_SEARCH_MATCHES) {
    return; // Stop collecting after limit
  }
  diffSearchMatches.push(match);
}
```

### 3. scopedDiffHighlightMap 크기 제한 (10000개)

**Before**:
```typescript
const scopedDiffHighlightMap = new Map<string, ...>();
scopedDiffHighlightMap.set(key, value);
```

**After**:
```typescript
const MAX_HIGHLIGHT_ENTRIES = 10000;
const scopedDiffHighlightMap = new Map<string, ...>();

function setHighlight(key: string, value: ...) {
  if (scopedDiffHighlightMap.size >= MAX_HIGHLIGHT_ENTRIES) {
    const first = scopedDiffHighlightMap.keys().next().value;
    if (first) scopedDiffHighlightMap.delete(first);
  }
  scopedDiffHighlightMap.set(key, value);
}
```

### 4. 파일 전환 시 정리

```typescript
function onFileChange() {
  // Clear file-specific data
  diffSearchMatches = [];
  scopedDiffHighlightMap.clear();
}
```

## Test Scenarios

### Scenario 1: collapsedFolders limit enforced

**Given**: collapsedFolders has 1000 entries
**When**: New folder is collapsed
**Then**: Oldest entry is removed, new entry added, size stays 1000

### Scenario 2: diffSearchMatches cleared on new search

**Given**: diffSearchMatches has previous matches
**When**: New search is performed
**Then**: Previous matches are cleared, new matches collected

### Scenario 3: Search stops at limit

**Given**: diffSearchMatches has 500 entries
**When**: Another match is found
**Then**: Match is not added, limit maintained

### Scenario 4: File change clears collections

**Given**: Collections have data
**When**: User selects different file
**Then**: diffSearchMatches and scopedDiffHighlightMap are cleared

## What to Mock

None - pure webview JavaScript logic.

## Acceptance Criteria

- [ ] `collapsedFolders` 최대 1000개
- [ ] `diffSearchMatches` 최대 500개
- [ ] `scopedDiffHighlightMap` 최대 10000개
- [ ] 새 검색 시작 시 이전 결과 초기화
- [ ] 파일 전환 시 파일별 데이터 정리
- [ ] 반복 작업 후에도 메모리 안정
