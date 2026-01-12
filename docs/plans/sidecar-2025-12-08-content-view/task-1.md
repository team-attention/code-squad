# Task 1: Domain & Application Layer

## Objective

Add ContentViewState interface to PanelState types and implement state management methods in PanelStateManager.

## Files to Modify

### 1. `src/application/ports/outbound/PanelState.ts`

**Add ContentViewState interface:**
```typescript
/**
 * State for displaying external content (HN articles, URLs) in main panel
 */
export interface ContentViewState {
    /** URL to display in iframe */
    url: string;
    /** Title to show in header */
    title: string;
}
```

**Extend PanelState interface:**
```typescript
export interface PanelState {
    // ... existing fields

    /** Active content view state, null when not showing content */
    contentView: ContentViewState | null;
}
```

### 2. `src/application/ports/outbound/IPanelStateManager.ts`

**Add methods to interface:**
```typescript
export interface IPanelStateManager {
    // ... existing methods

    /**
     * Open content view with specified URL and title
     * @param url URL to display in iframe
     * @param title Title to show in content view header
     */
    openContentView(url: string, title: string): void;

    /**
     * Close content view and return to previous view
     */
    closeContentView(): void;
}
```

### 3. `src/application/services/PanelStateManager.ts`

**Add method implementations:**
```typescript
openContentView(url: string, title: string): void {
    this.state = {
        ...this.state,
        contentView: { url, title }
    };
    this.triggerRender();
}

closeContentView(): void {
    this.state = {
        ...this.state,
        contentView: null
    };
    this.triggerRender();
}
```

**Modify selectFile to auto-close content view:**
```typescript
async selectFile(file: string): Promise<void> {
    // Close content view if open
    if (this.state.contentView) {
        this.state = { ...this.state, contentView: null };
    }

    // ... existing selectFile logic
}
```

**Update initial state:**
```typescript
private createInitialState(): PanelState {
    return {
        // ... existing initial values
        contentView: null
    };
}
```

## Test Scenarios

### TS-1.1: openContentView sets state correctly
**Given:** PanelState with contentView: null
**When:** openContentView('https://example.com', 'Example')
**Then:** state.contentView equals { url: 'https://example.com', title: 'Example' }

### TS-1.2: closeContentView clears state
**Given:** PanelState with contentView: { url: '...', title: '...' }
**When:** closeContentView()
**Then:** state.contentView equals null

### TS-1.3: selectFile auto-closes content view
**Given:** PanelState with contentView active
**When:** selectFile('some/file.ts')
**Then:** state.contentView equals null AND selectedFile equals 'some/file.ts'

### TS-1.4: Initial state has null contentView
**Given:** New PanelStateManager
**When:** getState()
**Then:** state.contentView equals null

## Verification

```bash
npm run compile
npm run lint
npm run test
```

## Acceptance Criteria

- [ ] ContentViewState interface defined
- [ ] PanelState.contentView field added
- [ ] IPanelStateManager methods added
- [ ] PanelStateManager implements openContentView
- [ ] PanelStateManager implements closeContentView
- [ ] selectFile auto-closes content view
- [ ] Initial state includes contentView: null
- [ ] Code compiles without errors
- [ ] Lint passes
