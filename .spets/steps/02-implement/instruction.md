# Implement Step

You are implementing the approved plan from the previous step. Follow the plan **exactly** while applying your engineering judgment for code quality.

## Your Goal

Execute the plan task-by-task, write high-quality code that follows existing patterns, verify each task, and document all changes.

## Core Principles

### 1. Follow the Plan
- Execute tasks in the **exact order** specified
- Check off each verification criterion as you complete it
- **Only deviate when absolutely necessary** (document why in "Deviations" section)
- One task at a time - mark in_progress, complete, then move to next

### 2. Test-Driven Development (TDD Iron Law)

**"If you didn't watch the test fail, you don't know if it tests the right thing."**

**ABSOLUTE REQUIREMENT:** NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST.

**Red-Green-Refactor Cycle:**
1. **RED**: Write one minimal test demonstrating required behavior
   - Use genuine code, not mocks (when feasible)
   - Test must fail for the RIGHT reason (missing functionality, not syntax errors)
   - If test passes immediately, you're testing existing behavior (restart)
2. **Verify RED**: Execute test, confirm failure
3. **GREEN**: Implement simplest code satisfying the test
   - No feature creep, no over-engineering
   - Goal: pass ONE test only
4. **Verify GREEN**: Confirm test passes, no regressions
5. **REFACTOR**: Eliminate duplication, improve naming (maintain green)

**TDD Red Flags (Trigger Restart):**
- Writing code before tests
- Adding tests post-implementation
- Tests passing immediately
- Rationalizing "just this once" exceptions
- Keeping "reference" implementations while writing tests

### 3. Verification-Before-Completion (Evidence Over Claims)

**"Evidence before claims, always."**

**The Verification Gate:**
1. Identify the command that proves your claim
2. Run the COMPLETE command fresh (not from memory)
3. Read FULL output and check exit codes
4. Verify whether output confirms the claim
5. Only THEN make the claim with evidence

**PROHIBITED language without verification:**
- "Should work now"
- "Probably passes"
- "Seems to be fixed"
- "Great!", "Done!", "Perfect!" (without evidence)

**CRITICAL RULE:** If you haven't run the verification command in THIS message, you CANNOT claim it passes.

### 4. Follow Existing Patterns
- Match the style, structure, and conventions of existing code **exactly**
- Reuse existing utilities and helpers (don't reinvent)
- Don't introduce new patterns unless the plan specifies them
- When in doubt, find similar code and copy its approach

### 5. Avoid Over-Engineering (YAGNI)
- Only implement what's in the plan (nothing more, nothing less)
- Don't add "nice-to-have" features
- Don't refactor code outside the scope
- Don't add extra error handling beyond what's needed
- Don't create abstractions for one-time use
- Don't add backwards-compatibility hacks (if unused, delete it)

### 6. Incremental Verification (Trust But Verify)
- Verify each task BEFORE moving to the next
- Run relevant tests after EACH change
- Check that code compiles/lints after EACH task
- Manually test critical paths
- **NEVER batch tasks** - one at a time with verification

## Process

### 1. Review the Plan (2-5 minutes)

Read the approved plan document carefully:
- [ ] Understand the overall goal
- [ ] Review all tasks and their dependencies
- [ ] Note the testing strategy
- [ ] Check acceptance criteria
- [ ] Identify any risks flagged in the plan

### 2. Execute Task-by-Task (Majority of time)

**CRITICAL: Default batch size is 3 tasks. Complete 3 tasks, report results, then proceed.**

**For each task in the plan:**

#### A. Prepare
- Mark task as **in_progress** before starting
- Read the task description and ALL verification criteria
- Check if dependencies (other tasks) are complete
- Review the file(s) to modify
- Understand the specific change needed
- Review pattern references from the plan

#### B. Implement (ALWAYS Test-First)

**For new functionality (TDD Required):**

**Step 1: RED - Write Failing Test**
```typescript
// Create/update test file following existing patterns
// Write ONE minimal test demonstrating required behavior
it('should [specific behavior]', () => {
  // Arrange: Set up test conditions
  // Act: Execute the function (will fail - not implemented yet)
  // Assert: Verify expected outcome
});
```

**Step 2: Verify RED**
- Run test: `npm test path/to/test.ts`
- Confirm: Test FAILS for the RIGHT reason
  - ✅ Good: "function X is not defined"
  - ✅ Good: "expected Y, got undefined"
  - ❌ Bad: Syntax error
  - ❌ Bad: Test passes (you're testing existing behavior)
- If test passes immediately → STOP and restart task

**Step 3: GREEN - Implement Minimum Code**
- Write the SIMPLEST code that makes the test pass
- Follow existing patterns EXACTLY (reference: `src/file.ts:lines`)
- No feature creep, no over-engineering
- Focus: Pass ONE test only

**Step 4: Verify GREEN**
- Run test: `npm test path/to/test.ts`
- Confirm: Test PASSES
- Confirm: No other tests broke (run full suite or affected tests)
- If any test fails → Fix immediately before proceeding

**Step 5: REFACTOR (Optional)**
- Eliminate duplication
- Improve naming
- Extract helpers
- **MAINTAIN GREEN** - tests must stay passing

**For bug fixes:**
1. **RED**: Write test demonstrating the bug (test fails)
2. **Verify RED**: Confirm test fails showing the bug
3. **GREEN**: Fix with minimal changes
4. **Verify GREEN**: Test passes, bug resolved
5. **Check**: No regressions in other tests

#### C. Verify Task Completion (THE VERIFICATION GATE)

**Run verification commands from the plan:**
```bash
# Example verifications (use actual commands from plan)
npm test path/to/test.ts              # Must pass
npm run lint path/to/file.ts          # No errors
npm run typecheck                     # No type errors
node -c path/to/file.ts               # Syntax valid
ls -l path/to/file.ts                 # File exists
```

**Check each criterion from the plan:**
- [ ] Implementation matches task specification EXACTLY
- [ ] ALL tests pass (specific + full suite)
- [ ] Code follows existing patterns (compare with reference files)
- [ ] No linting errors (ran command, checked output)
- [ ] No type errors (ran command, checked output)
- [ ] Manual checks complete (if specified in plan)
- [ ] File created/modified at exact path specified

**CRITICAL:** Only proceed to next task when **ALL criteria are met**.

**If any criterion fails:**
- Stop immediately
- Fix the issue
- Re-run verifications
- Only proceed when ALL pass

#### D. Document Progress

Mark task as **completed** and update implementation document:
- Task number and name
- Files modified/created
- Verification evidence (paste command outputs)
- Any key decisions made
- Any deviations from plan (with justification)

#### E. Stopping Points (When to STOP and Ask)

**STOP immediately if:**
- Blocker: Missing dependencies, unclear instructions
- Test fails 3+ times with different fixes (question the architecture)
- Verification fails repeatedly
- Gap in plan prevents starting task
- Comprehension issue with instructions
- Scope creep detected (task growing beyond plan)

**When stopped: Ask for clarification rather than guessing.**

### 3. Final Verification (5-10 minutes)

After all tasks complete:

#### A. Run Full Test Suite
```bash
npm test        # or yarn test, pnpm test
npm run lint    # or yarn lint
npm run build   # verify no build errors
```

#### B. Check Acceptance Criteria

Go through each criterion in the plan:
- [ ] All tasks completed as specified
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Manual verification checklist complete
- [ ] No regressions in existing functionality
- [ ] Code follows existing patterns
- [ ] Edge cases handled
- [ ] Error cases handled

#### C. Manual Testing

Test the feature end-to-end:
- [ ] Happy path works
- [ ] Edge cases behave correctly
- [ ] Error cases show appropriate messages
- [ ] No console errors or warnings

### 4. Document Implementation (5 minutes)

Complete the implementation document:
- Summarize what was built
- List all files created/modified
- Document key decisions
- Note any deviations from plan
- Provide testing evidence
- Suggest next steps if any

## Quality Checklist

Before marking implementation complete, verify:

### Code Quality
- [ ] Follows existing code style and conventions
- [ ] No unnecessary complexity or abstraction
- [ ] Variable/function names are clear and consistent
- [ ] No commented-out code (unless plan specifies)
- [ ] No debug console.logs or print statements
- [ ] Imports are organized consistently

### Testing Quality
- [ ] All tests pass
- [ ] Tests follow existing test patterns
- [ ] Test coverage for new code
- [ ] Edge cases tested
- [ ] Error cases tested
- [ ] No flaky tests

### Pattern Consistency
- [ ] Uses same testing library as existing tests
- [ ] Follows same file/folder structure
- [ ] Uses same state management approach
- [ ] Matches existing error handling patterns
- [ ] Consistent with existing API patterns

### Completeness
- [ ] All planned tasks completed
- [ ] All verification criteria met
- [ ] No TODOs or FIXMEs added
- [ ] Documentation updated if needed
- [ ] No breaking changes to existing APIs (unless planned)

## Anti-Patterns to Avoid

### Testing Anti-Patterns
❌ **Testing Mock Behavior** - Verifying mocks exist rather than actual functionality
❌ **Test-Only Methods** - Adding cleanup/helper methods to production code solely for tests
❌ **Over-Mocking** - Mocking without understanding dependencies
❌ **Incomplete Mocks** - Partial mocks with only known fields
❌ **Tests as Afterthought** - Writing tests after implementation

### TDD Anti-Patterns
❌ **Code before tests** - NEVER write implementation before failing test
❌ **Tests after implementation** - Violates TDD iron law
❌ **Tests passing immediately** - You're testing existing behavior, not new functionality
❌ **"Just this once" exceptions** - Pragmatism doesn't justify skipping TDD cycle

### Implementation Anti-Patterns
❌ **Batching tasks** - Verify each task individually before proceeding
❌ **Adding extra features** - Only implement what's in the plan (YAGNI)
❌ **Refactoring unrelated code** - Stay focused on planned tasks only
❌ **Introducing new patterns** - Follow existing patterns unless plan specifies
❌ **Over-engineering** - Simplest solution wins

### Verification Anti-Patterns
❌ **Claiming without evidence** - "Should work", "probably passes" (run the command!)
❌ **Ignoring failing tests** - Fix immediately, don't proceed
❌ **Skipping verification steps** - Every criterion must be checked
❌ **Trusting memory** - Re-run commands, don't rely on previous runs

### Process Anti-Patterns
❌ **Committing broken code** - All tests must pass before commit
❌ **Guessing when blocked** - Stop and ask for clarification
❌ **Scope creep** - Task growing beyond plan scope
❌ **Multiple fixes without hypothesis** - If 3+ fixes fail, question the architecture

## When to Deviate from Plan

Deviations should be **rare** and **justified**. Only deviate when:

1. **Discovering a Better Pattern**: Found an existing pattern in the codebase that wasn't noticed during planning
2. **Blocking Technical Issue**: Plan approach doesn't work due to unforeseen constraint
3. **Missing Dependency**: Discovered additional file/dependency needed
4. **Simplification Opportunity**: Can achieve same goal with significantly simpler approach

**When deviating:**
- Pause and document why deviation is necessary
- Consider if plan needs revision vs. proceeding with deviation
- Document the deviation and justification in implementation doc
- Update relevant tests and verification criteria

## Systematic Debugging (When Issues Arise)

### Four-Phase Debugging Process

#### Phase 1: Root Cause Investigation
1. Examine error messages thoroughly (full stack trace)
2. Reproduce issue consistently
3. Check recent changes (what changed since last working state?)
4. Add diagnostic instrumentation at each boundary
5. Trace data flow backward through call stack

#### Phase 2: Pattern Analysis
1. Locate similar working code in codebase
2. Study reference implementations COMPLETELY (no skimming)
3. Document EVERY difference between working and broken versions
4. List differences with hypothesis for each

#### Phase 3: Hypothesis and Testing
1. Formulate specific hypothesis: "I think X is the root cause because Y"
2. Test with minimal changes, ONE variable at a time
3. If unsuccessful, form NEW hypothesis (don't add more fixes)
4. **Critical**: If 3+ fixes fail, question the architecture - signal fundamental design problem

#### Phase 4: Implementation
1. Create failing test case first (if not already exists)
2. Implement SINGLE fix addressing root cause
3. Verify results with tests
4. Document the root cause and fix

**Core Principle:** "ALWAYS find root cause before attempting fixes. Symptom fixes are failure."

### If Tests Fail
1. Read FULL error message and stack trace
2. Check if implementation matches plan EXACTLY
3. Verify test is correct (not testing mock behavior)
4. Debug systematically using four-phase process above
5. Fix issue (root cause, not symptoms)
6. Re-run tests (specific test + full suite)
7. Document if it revealed a plan issue

### If Approach Doesn't Work
1. **Stop implementing immediately**
2. Document the issue with evidence
3. Run root cause investigation (Phase 1-2 above)
4. Consider if minor adjustment works:
   - If YES: Apply adjustment, document in "Key Decisions"
   - If NO: Major deviation needed
5. If major change needed:
   - Pause and document in "Deviations" section
   - Explain WHY plan approach didn't work (with evidence)
   - Describe alternative taken (with justification)
   - Update verification criteria if needed

### If Scope Grows
1. **Pause implementation immediately**
2. Document the scope creep
3. Assess: Essential vs. nice-to-have
   - Essential: Blocking, required for feature to work
   - Nice-to-have: Improvement, not critical
4. **If essential:**
   - Add as deviation with justification
   - Update task list
   - Add verification criteria
5. **If nice-to-have:**
   - Skip implementation
   - Note in "Next Steps" section for future work
   - Continue with planned tasks

## Time Management

- Task execution: 70%
- Testing/verification: 20%
- Documentation: 10%

**If implementation is taking much longer than plan estimated:**
- You may be over-engineering
- Check if you're adding extra features
- Verify you're following existing patterns (not creating new ones)
- Consider if scope crept beyond the plan

## Success Criteria

Implementation is complete when:

✅ All planned tasks executed successfully
✅ All tests passing (unit, integration, e2e)
✅ All acceptance criteria met
✅ Manual testing complete
✅ No linting/build errors
✅ Code follows existing patterns
✅ Implementation document complete
✅ Ready for code review / merge

**Remember: A successful implementation follows the plan closely, maintains code quality, and ships working, tested code.**
