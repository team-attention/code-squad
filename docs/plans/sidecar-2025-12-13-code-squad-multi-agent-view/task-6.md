# Task 6: Extend PanelState with Agent Fields

## Overview

**Layer**: Application (ports/outbound)
**Dependencies**: None
**Complexity**: Low

## Goal

Add agent-related fields to PanelState for UI display (agent name, status).

## Files to Modify

| File | Changes |
|------|---------|
| `src/application/ports/outbound/PanelState.ts` | Add agentName, agentStatus fields to PanelState interface |

## Implementation Details

### Update PanelState.ts

```typescript
import { AgentStatus } from '../../../domain/entities/AISession';

// Add to existing file

/**
 * Agent display information for multi-agent mode
 */
export interface AgentDisplayInfo {
    name: string;
    status: AgentStatus;
}

/**
 * Complete panel state - single source of truth for UI
 */
export interface PanelState {
    // ... existing fields ...
    sessionFiles: FileInfo[];
    uncommittedFiles: FileInfo[];
    showUncommitted: boolean;
    selectedFile: string | null;
    diff: DiffDisplayState | null;
    scopedDiff: ScopedDiffDisplayState | null;
    comments: CommentInfo[];
    aiStatus: AIStatus;
    isTreeView: boolean;
    diffViewMode: DiffViewMode;
    searchQuery: string;
    draftComment: DraftComment | null;
    fileScrollPositions: FileScrollPositions;
    hnStories: HNStoryInfo[];
    hnFeedStatus: HNFeedStatus;
    hnFeedError?: string;
    hnLastFetchTime?: number;
    hnHasMore: boolean;
    hnLoadingMore: boolean;
    showHNFeed: boolean;
    contentView: ContentViewState | null;

    // NEW: Multi-agent fields
    /** Agent display info (name and status) for multi-agent mode */
    agentInfo?: AgentDisplayInfo;
    /** Whether currently showing aggregated view of all agents */
    isAggregatedView?: boolean;
}

/**
 * Create initial empty state
 */
export function createInitialPanelState(): PanelState {
    return {
        // ... existing fields ...
        sessionFiles: [],
        uncommittedFiles: [],
        showUncommitted: false,
        selectedFile: null,
        diff: null,
        scopedDiff: null,
        comments: [],
        aiStatus: { active: false },
        isTreeView: true,
        diffViewMode: 'diff',
        searchQuery: '',
        draftComment: null,
        fileScrollPositions: {},
        hnStories: [],
        hnFeedStatus: 'idle',
        hnFeedError: undefined,
        hnLastFetchTime: undefined,
        hnHasMore: true,
        hnLoadingMore: false,
        showHNFeed: false,
        contentView: null,
        // NEW
        agentInfo: undefined,
        isAggregatedView: false,
    };
}
```

## Test Scenarios

### TS-6.1: Default State

**Given**: createInitialPanelState() is called
**When**: Checking agentInfo
**Then**: agentInfo should be undefined

### TS-6.2: Default Aggregated View

**Given**: createInitialPanelState() is called
**When**: Checking isAggregatedView
**Then**: isAggregatedView should be false

### TS-6.3: Type Definition - AgentDisplayInfo

**Given**: AgentDisplayInfo interface
**When**: TypeScript compiles
**Then**: name (string) and status (AgentStatus) are required fields

### TS-6.4: Type Definition - PanelState

**Given**: PanelState interface
**When**: Assigning { agentInfo: { name: "Test", status: "working" }, isAggregatedView: true }
**Then**: No TypeScript errors

### TS-6.5: Import AgentStatus

**Given**: PanelState.ts imports AgentStatus from AISession.ts
**When**: TypeScript compiles
**Then**: No import errors

## Acceptance Criteria

- [ ] AgentDisplayInfo interface defined with name and status fields
- [ ] PanelState has optional agentInfo field
- [ ] PanelState has optional isAggregatedView field
- [ ] createInitialPanelState() sets agentInfo to undefined
- [ ] createInitialPanelState() sets isAggregatedView to false
- [ ] AgentStatus type imported from domain/entities/AISession
- [ ] Existing code using PanelState remains compatible (new fields optional)
- [ ] `npm run compile` succeeds
- [ ] `npm run lint` passes
