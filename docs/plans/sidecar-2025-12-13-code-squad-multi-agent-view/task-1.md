# Task 1: Create AgentSession Entity

## Overview

**Layer**: Domain (entities)
**Dependencies**: None
**Complexity**: Low

## Goal

Create AgentSession entity that extends AISession with multi-agent metadata (name, role, status, fileCount).

## Files to Modify

| File | Changes |
|------|---------|
| `src/domain/entities/AISession.ts` | Add AgentStatus type, AgentMetadata interface, extend AISession class |
| `src/application/ports/outbound/SessionContext.ts` | Add optional agentMetadata field |

## Implementation Details

### 1. Extend AISession.ts

```typescript
// Add at top of file
export type AgentStatus = 'working' | 'idle' | 'waiting' | 'error';

export interface AgentMetadata {
    name: string;
    role?: string;
    status: AgentStatus;
    fileCount: number;
}

// Extend AISession class
export class AISession {
    // ... existing fields ...
    private _agentMetadata?: AgentMetadata;

    get agentMetadata(): AgentMetadata | undefined {
        return this._agentMetadata;
    }

    setAgentMetadata(metadata: AgentMetadata): void {
        this._agentMetadata = metadata;
    }

    get agentName(): string {
        return this._agentMetadata?.name ?? this.displayName;
    }

    get agentStatus(): AgentStatus {
        return this._agentMetadata?.status ?? 'idle';
    }
}
```

### 2. Update SessionContext.ts

```typescript
// Add to SessionContext interface
export interface SessionContext {
    // ... existing fields ...
    agentMetadata?: AgentMetadata;
}
```

## Test Scenarios

### TS-1.1: AgentSession Creation with Metadata

**Given**: A terminal with AI session
**When**: setAgentMetadata() is called with name="Backend Agent" and role="API development"
**Then**:
- agentMetadata.name should be "Backend Agent"
- agentMetadata.role should be "API development"
- agentMetadata.status should be 'idle' (default)
- agentMetadata.fileCount should be 0 (default)

### TS-1.2: Status Update

**Given**: An AISession with agentMetadata set
**When**: setAgentMetadata() is called with status='working'
**Then**: agentStatus getter should return 'working'

### TS-1.3: Backward Compatibility

**Given**: Existing code using AISession.create()
**When**: Code accesses displayName
**Then**: It should work unchanged (agentMetadata is optional)

### TS-1.4: Default Agent Name Fallback

**Given**: AISession without agentMetadata
**When**: agentName getter is called
**Then**: Should return displayName (e.g., "Claude")

## Acceptance Criteria

- [ ] AgentStatus type exported from AISession.ts
- [ ] AgentMetadata interface exported from AISession.ts
- [ ] AISession has setAgentMetadata() method
- [ ] AISession has agentName getter with fallback to displayName
- [ ] AISession has agentStatus getter with fallback to 'idle'
- [ ] SessionContext has optional agentMetadata field
- [ ] Existing tests pass (backward compatibility)
- [ ] `npm run compile` succeeds
- [ ] `npm run lint` passes
