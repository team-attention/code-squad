# Thread List UI Improvements

## Summary

Improved thread list item UI with better visual status indicators and terminal focus synchronization.

## Changes

### 1. Thread Item Layout
- Increased item height: `padding: 8px` → `padding: 12px`, `min-height: 44px`
- Increased gap between elements: `8px` → `10px`
- Removed file count display from right side

### 2. Status Indicator Redesign
- Changed icons to filled circles (●) for active states, empty circle (○) for inactive
- Color-coded status indicators:
  - `inactive`: Gray (disabled foreground)
  - `idle`: Blue (#3794ff)
  - `working`: Green (#89d185) with pulse animation and glow effect
  - `waiting`: Yellow (#cca700) with blink animation
- Added background blink animation for `waiting` state (entire row flashes yellow)

### 3. Terminal Focus Synchronization
- Thread list selection now updates when terminal panel is clicked
- Added `onTerminalFocusCallback` in AIDetectionController
- Added `updateSelectedThread` method in ThreadListController

### 4. Initial Session Status
- Changed initial session status from `idle` to `inactive`
- Sessions start as inactive until terminal activity is detected

## Files Changed

- `src/adapters/inbound/ui/ThreadListWebviewProvider.ts` - UI styles and rendering
- `src/adapters/inbound/controllers/AIDetectionController.ts` - Terminal focus callback, initial status
- `src/adapters/inbound/controllers/ThreadListController.ts` - updateSelectedThread method
- `src/extension.ts` - Connect terminal focus callback

## Visual Reference

| Status | Icon | Color | Animation |
|--------|------|-------|-----------|
| inactive | ○ | Gray | None |
| idle | ● | Blue | None |
| working | ● | Green | Pulse + Glow |
| waiting | ● | Yellow | Blink (icon + background) |
