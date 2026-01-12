# Task 1: Update AgentStatus Type

## Goal

Update `AgentStatus` type to include `inactive` state for terminals without AI agent.

## Files

- `src/domain/entities/AISession.ts`

## Changes

### Update AgentStatus type

```typescript
// Before
export type AgentStatus = 'working' | 'idle' | 'waiting' | 'error';

// After
export type AgentStatus = 'inactive' | 'idle' | 'working' | 'waiting';
```

### Status Semantics

| Status | Meaning | Icon |
|--------|---------|------|
| `inactive` | Terminal started, no AI agent detected | ○ (empty circle) |
| `idle` | AI exists but idle, ready for next command | ─ (dash) |
| `working` | AI actively processing | 🔄 (spinner) |
| `waiting` | AI waiting for permission/answer | ❓ (question) |

## Test Scenarios

### TS-1.1: Type compiles
- **Given**: Updated AgentStatus type
- **When**: `npm run compile`
- **Then**: No type errors

### TS-1.2: Default status is inactive
- **Given**: New session context created
- **When**: No status explicitly set
- **Then**: Default status should be `inactive`

## Notes

- Remove `error` status (not in spec, handle errors separately)
- Rename `waiting` semantic to match spec's `asking` (user permission)
- `inactive` replaces spec's `no_agent` (more descriptive in code)
