# Task 5: End-to-End Verification

## Objective

Verify all requirements from the spec are implemented correctly with comprehensive testing.

## Spec Requirements Checklist

### Functional Requirements

| ID | Requirement | Verified By |
|----|-------------|-------------|
| FR-1 | Content view in `.main-content` area | Manual test |
| FR-2 | Content/diff view switching | Manual test |
| FR-3 | Header with title and navigation | Manual test |
| FR-4 | iframe rendering with loading/error states | Manual test |

### Non-Functional Requirements

| ID | Requirement | Verified By |
|----|-------------|-------------|
| NFR-1 | Same UI hierarchy as diff viewer | Code inspection |
| NFR-2 | State management consistency | Unit test, manual test |
| NFR-3 | Memory efficiency (no extra panel) | Manual test, code inspection |

### Use Cases

| UC | Description | Test Scenario |
|----|-------------|---------------|
| UC-1 | OpenContentView | TS-E2E-1 |
| UC-2 | CloseContentView | TS-E2E-2, TS-E2E-3 |

## End-to-End Test Scenarios

### TS-E2E-1: Full Content View Flow
```
GIVEN: Sidecar panel open with waiting screen
WHEN: User clicks HN story link
THEN:
  - Content view appears in main content area
  - Header shows story title
  - Back button visible
  - Open in Browser button visible
  - iframe loads URL
  - Loading spinner shows then hides
  - File list in sidebar remains accessible
```

### TS-E2E-2: Close via Back Button
```
GIVEN: Content view displayed
WHEN: User clicks Back button
THEN:
  - Content view closes
  - Previous view restored (waiting screen or placeholder)
  - Header returns to default state
```

### TS-E2E-3: Close via File Selection
```
GIVEN: Content view displayed
AND: Files in session
WHEN: User clicks file in sidebar
THEN:
  - Content view closes immediately
  - Diff view shows for selected file
  - No confirmation dialog
```

### TS-E2E-4: Open in External Browser
```
GIVEN: Content view displayed
WHEN: User clicks "Open in Browser" button
THEN:
  - System browser opens with URL
  - Content view remains open in Sidecar
```

### TS-E2E-5: Content Load Error Handling
```
GIVEN: Content view opening
WHEN: URL fails to load (blocked by CSP, network error, etc.)
THEN:
  - Loading spinner hides
  - Error UI appears
  - Retry button functional
  - Open in Browser fallback available
```

### TS-E2E-6: State Persistence
```
GIVEN: Content view open
WHEN: Panel hidden then shown again (retainContextWhenHidden: true)
THEN:
  - Content view state preserved
  - iframe content may reload (expected browser behavior)
```

### TS-E2E-7: Multiple Panel Sessions
```
GIVEN: Two terminal sessions with Sidecar panels
WHEN: Opening content view in one panel
THEN:
  - Other panel unaffected
  - Each panel maintains independent state
```

## Manual Test Script

### Preparation
```bash
# Start extension in debug mode
# Press F5 in VSCode with extension project open
```

### Test Execution

1. **Setup**
   - Open terminal
   - Run `claude` or AI command to trigger detection
   - Wait for Sidecar panel to open

2. **HN Feed Load**
   - Observe waiting screen
   - Confirm HN stories load
   - Confirm story titles visible

3. **Open Content**
   - Click any HN story
   - Verify:
     - [ ] Content appears in same panel
     - [ ] No new panel created
     - [ ] Header shows story title
     - [ ] Loading spinner visible initially
     - [ ] iframe loads content

4. **Navigation Buttons**
   - Click "Open in Browser"
   - Verify:
     - [ ] System browser opens
     - [ ] Content view still open
   - Click "Back"
   - Verify:
     - [ ] Returns to waiting screen
     - [ ] Header resets

5. **File Selection Override**
   - Click HN story again
   - While content view open, click file in sidebar
   - Verify:
     - [ ] Content view closes
     - [ ] Diff view shows
     - [ ] No flash/glitch

6. **Error Handling**
   - Disconnect network or use known blocked URL
   - Verify:
     - [ ] Error state displays
     - [ ] Retry button works
     - [ ] Open in Browser fallback works

7. **Cleanup**
   - Close panel
   - Verify no errors in Debug Console

## Code Review Checklist

- [ ] No `articlePanel` references remain
- [ ] No `sidecarArticle` webview type used
- [ ] ContentViewState properly typed
- [ ] State immutability maintained
- [ ] Event listeners properly cleaned up
- [ ] Styles use VSCode CSS variables
- [ ] HTML properly escaped to prevent XSS
- [ ] iframe sandbox attributes appropriate

## Performance Verification

```bash
# Monitor memory before/after opening content views
# Check for leaks by repeatedly opening/closing
```

- [ ] No memory leaks on repeated open/close
- [ ] Single webview panel maintained
- [ ] No orphaned event listeners

## Final Verification Commands

```bash
npm run compile   # No errors
npm run lint      # No warnings
npm run test      # All tests pass

# Verify no dead code
grep -r "articlePanel" src/         # Empty
grep -r "openArticleInWebview" src/ # Empty
grep -r "sidecarArticle" src/       # Empty
```

## Acceptance Criteria

- [ ] All FR requirements verified
- [ ] All NFR requirements verified
- [ ] Both use cases work correctly
- [ ] All E2E test scenarios pass
- [ ] Manual test script completed
- [ ] Code review checklist passed
- [ ] Performance verification passed
- [ ] Final verification commands pass

## Sign-off

```
Implemented by: _______________
Reviewed by: _______________
Date: _______________
```
