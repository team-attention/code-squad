# Task 7: Update PanelStateManager for Agent Metadata

## Overview

**Layer**: Application (services)
**Dependencies**: Task 6
**Complexity**: Low

## Goal

Add methods to IPanelStateManager and PanelStateManager for setting/getting agent metadata.

## Files to Modify

| File | Changes |
|------|---------|
| `src/application/services/IPanelStateManager.ts` | Add setAgentInfo, setAggregatedView methods |
| `src/application/services/PanelStateManager.ts` | Implement new methods |

## Implementation Details

### Update IPanelStateManager.ts

```typescript
import { AgentDisplayInfo } from '../ports/outbound/PanelState';

export interface IPanelStateManager {
    // ... existing methods ...
    getState(): PanelState;
    setFiles(files: FileInfo[]): void;
    setBaseline(files: FileInfo[]): void;
    // ... etc ...

    // NEW: Agent metadata methods
    /**
     * Set agent display info for multi-agent mode.
     * Pass undefined to clear agent info.
     */
    setAgentInfo(info: AgentDisplayInfo | undefined): void;

    /**
     * Set aggregated view mode.
     * When true, panel shows files from all agents.
     */
    setAggregatedView(isAggregated: boolean): void;
}
```

### Update PanelStateManager.ts

```typescript
import { AgentDisplayInfo } from '../ports/outbound/PanelState';

export class PanelStateManager implements IPanelStateManager {
    // ... existing implementation ...

    setAgentInfo(info: AgentDisplayInfo | undefined): void {
        this.state.agentInfo = info;
        this.emitUpdate();
    }

    setAggregatedView(isAggregated: boolean): void {
        this.state.isAggregatedView = isAggregated;
        this.emitUpdate();
    }
}
```

## Test Scenarios

### TS-7.1: Set Agent Info

**Given**: PanelStateManager instance
**When**: setAgentInfo({ name: "Backend Agent", status: "working" }) is called
**Then**:
- state.agentInfo.name should be "Backend Agent"
- state.agentInfo.status should be "working"
- emitUpdate (render callback) should be triggered

### TS-7.2: Clear Agent Info

**Given**: PanelStateManager with agentInfo set
**When**: setAgentInfo(undefined) is called
**Then**:
- state.agentInfo should be undefined
- emitUpdate should be triggered

### TS-7.3: Set Aggregated View

**Given**: PanelStateManager instance
**When**: setAggregatedView(true) is called
**Then**:
- state.isAggregatedView should be true
- emitUpdate should be triggered

### TS-7.4: Interface Compliance

**Given**: IPanelStateManager interface
**When**: Class implements setAgentInfo and setAggregatedView
**Then**: TypeScript should compile without errors

### TS-7.5: Render Callback Triggered

**Given**: PanelStateManager with render callback set
**When**: setAgentInfo() is called
**Then**: Render callback should receive updated state with agentInfo

## Acceptance Criteria

- [ ] IPanelStateManager has setAgentInfo(info: AgentDisplayInfo | undefined) method
- [ ] IPanelStateManager has setAggregatedView(isAggregated: boolean) method
- [ ] PanelStateManager implements setAgentInfo()
- [ ] PanelStateManager implements setAggregatedView()
- [ ] setAgentInfo() triggers emitUpdate/render callback
- [ ] setAggregatedView() triggers emitUpdate/render callback
- [ ] AgentDisplayInfo imported from PanelState
- [ ] `npm run compile` succeeds
- [ ] `npm run lint` passes
