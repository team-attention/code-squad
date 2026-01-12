# Task 1: Add showHNFeed State to PanelState

**Layer**: Application (ports/outbound)
**Dependencies**: None

## Goal

Add a new `showHNFeed` boolean field to PanelState to control whether the HN feed is displayed when files are available but user wants to toggle back to feed.

## Files to Modify

| File | Changes |
|------|---------|
| `src/application/ports/outbound/PanelState.ts` | Add `showHNFeed: boolean` field |

## Test Scenarios

### TS-1.1: Default State Initialization
- **Given** initial panel state is created
- **When** `createInitialPanelState()` is called
- **Then** `showHNFeed` should default to `false`

### TS-1.2: Type Definition
- **Given** PanelState interface
- **When** TypeScript compiles
- **Then** `showHNFeed` field should be typed as `boolean`

## Implementation Guidance

1. Open `src/application/ports/outbound/PanelState.ts`

2. Add `showHNFeed` field to the `PanelState` interface (around line 153):
   ```typescript
   export interface PanelState {
     // ... existing fields ...
     showHNFeed: boolean;  // Controls whether HN feed is shown (for toggle)
   }
   ```

3. Initialize `showHNFeed` in `createInitialPanelState()` (around line 177):
   ```typescript
   export function createInitialPanelState(): PanelState {
     return {
       // ... existing fields ...
       showHNFeed: false,
     };
   }
   ```

## Validation

```bash
npm run compile
```

Ensure no TypeScript errors related to missing `showHNFeed` property.
