# Plan: {{title}}

## Summary

<!-- 2-3 sentences: What will be built, why it's needed, how it works -->

**Goal:** [One sentence describing the core objective]

**Architecture:** [2-3 sentences describing high-level approach]

**Tech Stack:** [Key technologies, libraries, or patterns involved]

## Codebase Analysis

### Current State

<!-- What exists NOW in the codebase -->

**Relevant Files Found:**
- `src/path/to/file.ts` - [What it does, why relevant]
- `src/path/to/other.ts` - [What it does, why relevant]

**Existing Patterns to Follow:**
- `src/services/auth.ts:45-78` - Authentication flow pattern
  - WHY: Shows JWT creation and refresh handling structure
- `src/utils/validation.ts:sanitizeInput()` - Input sanitization pattern
  - WHY: Must apply same sanitization approach for consistency

**Similar Features:**
- Feature X in `src/features/x/` - [How implemented, what to learn from it]
- Pattern Y in `src/patterns/y.ts` - [How structured, what to reuse]

**Testing Approach:**
- Testing library: [Jest/Vitest/etc]
- Test location: `src/**/*.test.ts` or `__tests__/`
- Example pattern: `src/__tests__/auth.test.ts:describe("login")` - [What pattern to follow]

### Key Findings

<!-- Important discoveries from exploration -->

**File Structure:**
- [Describe organization, where new files should go]

**Dependencies:**
- External: [npm packages used]
- Internal: [modules that will be imported]

**Code Conventions:**
- Naming: [camelCase, PascalCase patterns]
- File organization: [barrel exports, index files, etc]
- Error handling: [How errors are thrown/caught, example: `src/errors/AppError.ts`]

**Integration Points:**
- [Where this feature connects to existing code]
- [What interfaces/contracts must be maintained]

**Existing Utilities to Reuse:**
- `src/utils/logger.ts` - [How to use it]
- `src/utils/config.ts` - [How to use it]

## Architecture Decisions

### Chosen Approach: [Approach Name]

<!-- Detailed description of chosen approach -->

**How it works:**
1. [Step 1 of architecture]
2. [Step 2 of architecture]
3. [Step 3 of architecture]

**Why this approach:**
- Follows pattern from `src/path/file.ts:lines` - [Specific pattern]
- Consistent with existing [convention/pattern]
- Reuses existing [utility/helper]
- Simple and focused (avoids over-engineering)

**Pattern References:**
- `src/services/auth.ts:45-78` - Auth flow pattern (JWT creation, refresh)
  - **Extract:** Token generation structure
  - **Apply to:** Our new auth endpoint
- `src/types/user.ts:UserDTO` - Response type pattern
  - **Extract:** Response shape consistency
  - **Apply to:** Our new API response

### Alternatives Considered

**Alternative 1: [Name]**
- Description: [How it would work]
- Pros: [Advantages]
- Cons: [Disadvantages]
- Not chosen because: [Specific reason with evidence]

**Alternative 2: [Name]**
- Description: [How it would work]
- Pros: [Advantages]
- Cons: [Disadvantages]
- Not chosen because: [Specific reason with evidence]

### Test Strategy

**Chosen approach:** TDD (Red-Green-Refactor) / Tests After / Manual QA Only

**Rationale:** [Why this testing approach for this feature]

## Task Breakdown

<!-- CRITICAL: Each task should be 2-5 minutes MAXIMUM, with zero-context documentation -->

### Phase 1: [Phase Name - e.g., "Type Definitions & Infrastructure"]

#### Task 1: [Verb] [What] in [Specific File]

**File:** `src/exact/path/to/file.ts` (Create / Modify)

**Changes:**
- Add/Modify: [Specific function, interface, or logic]
- Code location: [Function name or around line X]
- Code sample (if helpful):
  ```typescript
  // Follow pattern from src/example.ts:45
  export interface ConfigType {
    field1: string;
    field2: number;
  }
  ```

**Steps:**
1. [Granular step 1 with exact details]
2. [Granular step 2 with exact details]
3. [Granular step 3 with exact details]
4. [Commit changes with message: "..."]

**Verification:**
- [ ] Run: `npm run typecheck` (or specific command)
- [ ] Expected: No type errors
- [ ] Check: File exists at path and exports [specific items]

**Dependencies:** None / Requires Task X

**Parallelizable:** YES (with Task Y, Z) / NO

**Estimated Time:** 2-5 minutes

**Commit Message:** `feat: add ConfigType interface for [feature]`

---

#### Task 2: [Verb] [What] in [Specific File]

**File:** `src/exact/path/to/file.ts` (Create / Modify)

**Changes:**
- Add/Modify: [Specific function, interface, or logic]
- Code location: [Function name or around line X]
- Reference pattern: `src/reference/file.ts:123` - [What pattern to follow]

**Steps:**
1. [Granular step 1]
2. [Granular step 2]
3. [Granular step 3]
4. [Commit]

**Verification:**
- [ ] Run: `node -c src/exact/path/to/file.ts` (syntax check)
- [ ] Expected: No errors
- [ ] Check: Function exports correctly

**Dependencies:** Requires Task 1

**Parallelizable:** NO (sequential after Task 1)

**Estimated Time:** 3-5 minutes

**Commit Message:** `feat: implement [function] for [feature]`

---

### Phase 2: [Phase Name - e.g., "Core Implementation"]

<!-- Continue with tasks for this phase -->

---

### Phase 3: [Phase Name - e.g., "Testing"]

<!-- All test-related tasks -->

---

### Phase 4: [Phase Name - e.g., "Integration & Verification"]

<!-- Integration and final verification tasks -->

## Files to Modify

| File | Action | Description | Phase | Task # |
|------|--------|-------------|-------|---------|
| `src/types/config.ts` | Create | Type definitions for config | 1 | 1 |
| `src/utils/helper.ts` | Modify | Add new helper function | 2 | 3, 4 |
| `src/services/api.ts` | Modify | Integrate new endpoint | 2 | 5 |
| `src/__tests__/helper.test.ts` | Create | Unit tests for helper | 3 | 6 |
| `src/__tests__/api.test.ts` | Modify | Integration tests | 3 | 7 |

## Testing Strategy

### Test Approach

**Strategy:** TDD (Red-Green-Refactor) / Tests After / Manual QA Only

**Rationale:** [Why this approach for this feature]

### Unit Tests

**Test file:** `src/**/*.test.ts` or `src/**/*.spec.ts` (follow existing convention)

**Testing library:** [Jest/Vitest/etc - based on existing patterns]

**Reference pattern:** `src/__tests__/auth.test.ts:describe("login")` - Follow this structure

**Test cases to implement:**

**Happy Path:**
- [ ] Test Case 1: [Specific scenario] - Expected: [Specific result]
- [ ] Test Case 2: [Specific scenario] - Expected: [Specific result]

**Edge Cases:**
- [ ] Edge Case 1: [Empty input] - Expected: [How handled]
- [ ] Edge Case 2: [Boundary value] - Expected: [How handled]
- [ ] Edge Case 3: [Maximum value] - Expected: [How handled]

**Error Cases:**
- [ ] Error Case 1: [Invalid input] - Expected: [Error thrown/returned]
- [ ] Error Case 2: [Missing data] - Expected: [Error thrown/returned]
- [ ] Error Case 3: [Network failure] - Expected: [Error thrown/returned]

**Verification Commands:**
```bash
# Run specific test file
npm test src/__tests__/helper.test.ts

# Run all tests
npm test

# Run with coverage
npm test -- --coverage
```

### Integration Tests

**Integration scenarios:**
- [ ] Scenario 1: [Feature X integrates with Y]
  - Command: `npm test -- integration`
  - Expected: [Specific outcome]
- [ ] Scenario 2: [End-to-end flow]
  - Command: [Specific command]
  - Expected: [Specific outcome]

### Manual Verification

**Manual testing checklist:**
- [ ] Start application: `npm run dev`
- [ ] Navigate to [specific URL/page]
- [ ] Perform action: [Specific user action]
- [ ] Verify: [Specific expected outcome]
- [ ] Check console: No errors or warnings
- [ ] Check network tab: [Expected requests/responses]

**Environment:** Development / Staging / Production

**Browser compatibility (if applicable):**
- [ ] Chrome
- [ ] Firefox
- [ ] Safari

## Acceptance Criteria

<!-- Concrete, verifiable checklist -->

### Implementation Complete
- [ ] All tasks in all phases completed as specified
- [ ] All files created/modified as planned
- [ ] All verification commands pass
- [ ] Code committed with proper messages

### Tests Passing
- [ ] All unit tests passing: `npm test`
- [ ] All integration tests passing: `npm test -- integration`
- [ ] Test coverage ≥ [X%] for new code: `npm test -- --coverage`
- [ ] No flaky tests (all tests pass consistently)

### Code Quality
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run typecheck`
- [ ] Build succeeds: `npm run build`
- [ ] Code follows existing patterns (matches reference files)
- [ ] No commented-out code
- [ ] No debug console.logs

### Functionality
- [ ] Manual verification checklist complete
- [ ] Happy path works as expected
- [ ] Edge cases handled appropriately
- [ ] Error cases show proper error messages
- [ ] No console errors or warnings

### Non-Regression
- [ ] Existing tests still pass
- [ ] No breaking changes to public APIs
- [ ] Existing features unaffected

**Status:** ✅ All criteria must be checked before considering feature complete

## Risks & Considerations

### Technical Risks

- **Risk 1**: [Specific technical risk]
  - **Impact:** [What could go wrong]
  - **Mitigation:** [Concrete steps to prevent/handle]
  - **Contingency:** [Backup plan if mitigation fails]

- **Risk 2**: [Specific technical risk]
  - **Impact:** [What could go wrong]
  - **Mitigation:** [Concrete steps to prevent/handle]
  - **Contingency:** [Backup plan if mitigation fails]

### Edge Cases

- **Empty/Null Input**
  - Scenario: [When this happens]
  - Handling: [How code handles it]
  - Test coverage: Task #[X]

- **Boundary Values**
  - Scenario: [Min/max values, array boundaries]
  - Handling: [How code handles it]
  - Test coverage: Task #[X]

- **Race Conditions (if applicable)**
  - Scenario: [Concurrent access/updates]
  - Handling: [Locking, atomicity approach]
  - Test coverage: Task #[X]

### Dependencies

**External Dependencies:**
- Package: `[package-name]` (version [X.Y.Z])
  - Purpose: [What it's used for]
  - Impact: [What breaks if it fails]

**Internal Dependencies:**
- Module: `src/path/to/module.ts`
  - Purpose: [What it provides]
  - Impact: Changes require Task #[X] update

**Breaking Changes:**
- None / [Specific breaking changes]
- Migration path: [How to update existing code]
- Affected code: [Files/modules that need updates]

### Performance Considerations

- **Performance Impact:** Low / Medium / High
- **Specific concerns:**
  - [Concern 1: e.g., "Large array iteration"]
    - Mitigation: [e.g., "Use pagination"]
  - [Concern 2: e.g., "Expensive computation"]
    - Mitigation: [e.g., "Cache results"]

## Implementation Notes

<!-- Critical context for implementer -->

### Code Patterns to Follow

**Pattern 1: [Pattern name]**
```typescript
// Reference: src/example/file.ts:45-67
// Use this pattern for [specific case]

export function example(param: Type): ReturnType {
  // Follow this structure
  const result = processData(param);
  return result;
}
```

**Pattern 2: [Pattern name]**
```typescript
// Reference: src/other/file.ts:123-145
// Use this pattern for [specific case]
```

### Gotchas & Pitfalls

- **Gotcha 1**: [Specific thing to watch out for]
  - Why it matters: [Consequence if ignored]
  - How to avoid: [Specific action]

- **Gotcha 2**: [Specific thing to watch out for]
  - Why it matters: [Consequence if ignored]
  - How to avoid: [Specific action]

### Common Mistakes to Avoid

- ❌ Don't [specific anti-pattern] - [Why it's wrong]
- ❌ Don't [specific anti-pattern] - [Why it's wrong]
- ✅ Do [correct pattern] - [Why it's right]

### Debugging Tips

- If [specific problem], check [specific location/log]
- If tests fail with [specific error], likely cause is [root cause]

---

## Task Flow Visualization

```
Phase 1 (Infrastructure)
  Task 1 → Task 2
           ↓
  Task 3 (parallel with 4)
  Task 4 (parallel with 3)

Phase 2 (Implementation)
  Task 5 (depends on 2, 3, 4)
           ↓
  Task 6 → Task 7

Phase 3 (Testing)
  Task 8 → Task 9 → Task 10

Phase 4 (Verification)
  Task 11 (depends on all previous)
```

## Estimated Effort

- **Total phases:** [X]
- **Total tasks:** [Y]
- **Estimated time:** [Z minutes] (sum of all task estimates)
- **Complexity:** Low / Medium / High
- **Parallelization opportunities:** [X tasks can run in parallel]

---

## Plan Completion Checklist

Before submitting this plan, verify:
- [ ] ALL tasks are 2-5 minutes with exact file paths
- [ ] ≥80% of tasks reference specific existing code (file:line)
- [ ] EVERY task has concrete verification (command + expected output)
- [ ] Zero assumptions about business logic or patterns
- [ ] Test strategy decided and documented
- [ ] Dependencies and parallelization marked
- [ ] Phase organization logical and complete
- [ ] One complete plan (not split into multiple phases to plan later)
