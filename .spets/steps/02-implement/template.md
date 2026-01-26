# Implementation: {{title}}

## Summary

<!-- 2-3 sentences: What was built, how it works, what problem it solves -->

## Task Execution

<!-- Track each task from the plan with TDD cycle -->

### Task 1: [Task Name from Plan]

**Status:** ✅ Complete | ⏳ In Progress | ⏸️ Blocked

**TDD Cycle (if applicable):**
- [x] RED: Test written and fails for correct reason
- [x] GREEN: Implementation passes test
- [x] REFACTOR: Code cleaned up (if needed)

**Implementation:**
- File: `src/path/to/file.ts` (Created / Modified)
- Changes: [What was added/modified]
- Code reference: [Function/class/interface name or line numbers]
- Pattern followed: `src/reference/file.ts:123` - [What pattern]

**Verification Evidence:**
```bash
# Test verification
$ npm test src/path/to/test.ts
✓ Test suite passes (X tests)

# Lint verification
$ npm run lint src/path/to/file.ts
✓ No linting errors

# Type check
$ npm run typecheck
✓ No type errors
```

**Verification Checklist:**
- [x] Test fails with expected error (RED)
- [x] Implementation makes test pass (GREEN)
- [x] All verification commands from plan pass
- [x] Code follows existing patterns
- [x] No linting/type errors
- [x] Manual checks complete (if specified)

**Commit:** `feat: [commit message from plan]` - [commit hash or "committed"]

**Notes:** [Any important details or decisions made during this task]

---

### Task 2: [Task Name from Plan]

**Status:** ✅ Complete | ⏳ In Progress | ⏸️ Blocked

**TDD Cycle (if applicable):**
- [x] RED: Test written and fails for correct reason
- [x] GREEN: Implementation passes test
- [x] REFACTOR: Code cleaned up (if needed)

**Implementation:**
- File: `src/path/to/file.ts` (Created / Modified)
- Changes: [What was added/modified]
- Code reference: [Function/class/interface name or line numbers]
- Pattern followed: `src/reference/file.ts:123` - [What pattern]

**Verification Evidence:**
```bash
# Commands run with actual output
$ [command from plan]
[actual output showing success]
```

**Verification Checklist:**
- [x] [Verification criterion 1 from plan]
- [x] [Verification criterion 2 from plan]
- [x] [Verification criterion 3 from plan]
- [x] Tests passing
- [x] No regressions

**Commit:** `[commit message]` - [commit hash]

**Notes:** [Any important details or decisions made during this task]

---

<!-- Add a section for each task from the plan -->

## Changes Made

### New Files Created

| File | Purpose | Lines of Code | Related Task |
|------|---------|--------------|--------------|
| `src/path/to/new-file.ts` | [What it does] | ~XX | Task #1 |
| `src/path/to/new-test.spec.ts` | [Test file for...] | ~XX | Task #2 |

### Modified Files

| File | What Changed | Lines Changed | Related Task |
|------|--------------|---------------|--------------|
| `src/path/to/file.ts` | [Description of changes] | +XX -YY | Task #3 |
| `src/path/to/other.ts` | [Description of changes] | +XX -YY | Task #4 |

### Files Summary

- **Total new files:** X
- **Total modified files:** Y
- **Total lines added:** ~XXX
- **Total lines removed:** ~YYY

## Key Decisions

<!-- Document important decisions made during implementation -->

### Decision 1: [Decision Name]

**Context:** [Why this decision was needed]

**Chosen Approach:** [What was decided]

**Rationale:** [Why this approach]

**Alternatives Considered:** [Other options and why not chosen]

---

### Decision 2: [Decision Name]

**Context:** [Why this decision was needed]

**Chosen Approach:** [What was decided]

**Rationale:** [Why this approach]

**Alternatives Considered:** [Other options and why not chosen]

---

## Deviations from Plan

<!-- ONLY include if there were deviations. Otherwise, write "None - plan was followed exactly." -->

### Deviation 1: [What deviated]

**Original Plan:** [What the plan specified]

**What Was Done Instead:** [Actual implementation]

**Justification:** [Why deviation was necessary]

**Impact:** [How this affects the feature]

---

**OR if no deviations:**

None - the plan was followed exactly as specified.

## Testing

### Test Suite Results

```bash
# Full test suite
$ npm test
✓ XX tests passing
✗ 0 tests failing
Test Suites: X passed, X total
Tests: XX passed, XX total
Time: X.XXs

# Coverage report
$ npm test -- --coverage
Coverage: XX%
Statements: XX% (XX/XX)
Branches: XX% (XX/XX)
Functions: XX% (XX/XX)
Lines: XX% (XX/XX)
```

### Unit Tests

| Test File | Tests Added | Test Cases | Status |
|-----------|-------------|------------|--------|
| `src/**/*.test.ts` | X tests | Happy path, edge cases, errors | ✅ All pass |
| `src/**/*.spec.ts` | X tests | [Specific scenarios] | ✅ All pass |

**TDD Evidence for Each Test:**
```bash
# Test 1: [Test name]
# RED phase - test fails as expected
$ npm test src/path/test.ts
✗ [Test name] - function not defined (expected failure)

# GREEN phase - test passes after implementation
$ npm test src/path/test.ts
✓ [Test name] - passes

# Verify no regressions
$ npm test
✓ All tests pass
```

**Test Coverage Checklist:**
- [x] Happy path tested with specific scenarios
- [x] Edge cases tested: [list specific edge cases]
- [x] Error cases tested: [list specific error cases]
- [x] All new code covered (≥XX% coverage)
- [x] No flaky tests (ran 3+ times, consistent results)

### Integration Tests

| Test | Command | Status | Evidence |
|------|---------|--------|----------|
| [Test name] | `npm test -- integration` | ✅ Pass | [Output snippet] |
| [Test name] | `npm test -- e2e` | ✅ Pass | [Output snippet] |

**Integration Test Evidence:**
```bash
$ npm test -- integration
✓ Integration test 1: [scenario]
✓ Integration test 2: [scenario]
All integration tests pass
```

### Manual Testing Checklist

<!-- From the plan's acceptance criteria -->

**Setup:**
- [x] Environment: Development / Staging
- [x] Command: `npm run dev` or [specific command]

**Test Scenarios:**
- [x] [Manual check 1 from plan] - Result: [Expected outcome achieved]
- [x] [Manual check 2 from plan] - Result: [Expected outcome achieved]
- [x] [Manual check 3 from plan] - Result: [Expected outcome achieved]
- [x] No console errors or warnings
- [x] No network errors in browser dev tools
- [x] Works in [relevant environment/browser]

### Evidence

<!-- Screenshots, logs, or other proof of testing -->

**Test Output:**
```bash
[Paste complete test output showing all tests passing]
```

**Manual Test Screenshot/Log:**
```
[Paste evidence of manual testing - browser console clean, feature working]
```

**Performance/Load Test (if applicable):**
```
[Paste performance metrics if relevant]
```

## Acceptance Criteria Verification

<!-- Go through EVERY criterion from the plan with evidence -->

### Implementation Complete
- [x] All tasks completed as specified (Tasks 1-X all marked complete)
- [x] All files created/modified as planned (see "Files Modified" table)
- [x] All verification commands pass (evidence in each task section)
- [x] Code committed with proper messages (all commits listed)

### Tests Passing (with Evidence)
```bash
# Full test suite
$ npm test
✓ All tests pass (XX passing, 0 failing)

# Integration tests
$ npm test -- integration
✓ All integration tests pass

# Coverage
$ npm test -- --coverage
✓ Coverage ≥XX% for new code
```

- [x] All unit tests passing (evidence above)
- [x] All integration tests passing (evidence above)
- [x] Test coverage ≥[X%] for new code (evidence above)
- [x] No flaky tests (ran multiple times, consistent)

### Code Quality (with Evidence)
```bash
# Lint check
$ npm run lint
✓ No linting errors

# Type check
$ npm run typecheck
✓ No type errors

# Build check
$ npm run build
✓ Build successful
```

- [x] No linting errors (evidence above)
- [x] No type errors (evidence above)
- [x] Build succeeds (evidence above)
- [x] Code follows existing patterns (references checked)
- [x] No commented-out code
- [x] No debug console.logs

### Functionality
- [x] Manual verification checklist complete (see Manual Testing section)
- [x] Happy path works as expected
- [x] Edge cases handled appropriately (list: [cases])
- [x] Error cases show proper error messages (list: [cases])
- [x] No console errors or warnings

### Non-Regression
- [x] Existing tests still pass (full suite run, all pass)
- [x] No breaking changes to public APIs
- [x] Existing features unaffected (spot-checked: [features])

**Status:** ✅ All criteria met | ⚠️ [X criteria pending] - [Details]

**Pending Items (if any):**
- [ ] [Item 1] - Reason: [Why pending] - Plan: [How to resolve]

## Quality Assurance

### Code Quality

- [x] Follows existing code style and conventions
- [x] No unnecessary complexity
- [x] Clear and consistent naming
- [x] No commented-out code
- [x] No debug statements
- [x] Imports organized

### Pattern Consistency

- [x] Uses same testing library as existing code
- [x] Follows same file structure
- [x] Matches existing error handling
- [x] Consistent with existing patterns
- [x] No new patterns introduced unnecessarily

### Build & Lint

```bash
# Build command
npm run build
✓ Build successful

# Lint command
npm run lint
✓ No linting errors
```

## Performance Impact

<!-- If applicable, describe any performance considerations -->

- No significant performance impact / [Description of impact]
- Performance testing: [Results if applicable]

## Breaking Changes

<!-- IMPORTANT: Document any breaking changes -->

None / [List breaking changes and migration instructions]

## Known Issues / Limitations

<!-- Any known issues or limitations -->

None / [List any known issues that are acceptable]

## Next Steps

<!-- Future work, follow-ups, or improvements -->

### Immediate Follow-ups

- [ ] [Follow-up task 1]
- [ ] [Follow-up task 2]

### Future Enhancements

- [Enhancement 1]
- [Enhancement 2]

## Documentation Updates

<!-- Any documentation that was updated or needs updating -->

- [x] Code comments added where needed
- [x] / [ ] README updated
- [x] / [ ] API documentation updated
- [x] / [ ] User guide updated
- N/A / [Other documentation]

## Deployment Notes

<!-- Any special considerations for deployment -->

- Environment variables needed: [List or "None"]
- Database migrations: [Yes/No - details if yes]
- Configuration changes: [List or "None"]
- Dependencies added: [List new dependencies]

## Summary for Review

<!-- Concise summary for code reviewer -->

**What:** [One sentence describing the change]

**Why:** [One sentence on why it was needed]

**How:** [One sentence on approach taken]

**Testing:** [One sentence on how it was verified]

**Risk Level:** Low / Medium / High

---

**Implementation completed:** [Date]

**Ready for:** Code Review / Merge / Deployment
