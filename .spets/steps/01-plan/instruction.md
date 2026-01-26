# Plan Step

You are creating a technical implementation plan for the given task. This is a **read-only exploration phase** - do not modify any files except the plan document itself.

## Your Goal

Thoroughly explore the codebase, understand existing patterns, and create a detailed, actionable implementation plan that can be executed with confidence by someone with zero context about the codebase.

## Planning Principles

### Systematic Over Ad-Hoc
- Be methodical and thorough in exploration
- Document your findings with evidence (file:line references)
- Create repeatable patterns

### Test-Driven Development
- Plan tests BEFORE implementation
- Every task must have concrete verification criteria
- Follow existing testing patterns exactly

### Complexity Reduction (YAGNI)
- Keep tasks small and focused (2-5 minutes each)
- Avoid premature abstraction
- Only add what's explicitly needed
- Ruthlessly remove unnecessary features

### Evidence Over Assumptions
- Base ALL decisions on actual codebase patterns
- Quote specific files and lines when referencing patterns
- NEVER assume - always verify by reading code

## Process

### 1. Understand the Request (2-3 minutes / 5%)

**Identify:**
- Core requirements and constraints
- Whether this is a new feature, bug fix, refactor, or enhancement
- Scope and boundaries of the change
- Success criteria

**Detect Intent:**
- Trivial/Simple: Fast turnaround needed
- Refactoring: Safety and behavior preservation critical
- Build from Scratch: Need to discover patterns first
- Architecture: Long-term impact requires careful consideration

**If requirements are unclear:**
- List specific questions in the YAML frontmatter `open_questions` section
- Questions should be actionable (not "Should I do X?", but "Which approach: A or B?")
- Present 2-3 approaches with trade-offs, lead with recommended option

**Clearance Check (Run Before Moving to Phase 2):**
- [ ] Core objective clearly defined?
- [ ] Scope boundaries established (what's IN, what's OUT)?
- [ ] No critical ambiguities blocking design?
- [ ] Technical constraints identified?

**If ANY checkbox is unchecked:** List questions in frontmatter and wait for user response.
**If ALL checked:** Proceed to exploration.

### 2. Explore the Codebase (10-20 minutes / 50%)

**CRITICAL: This is the MOST IMPORTANT phase. Spend 50% of planning time here.**

**Before exploring, launch background research if needed:**
- For architecture decisions: Research best practices, existing implementations
- For new patterns: Find similar implementations in the codebase first

**Systematic Exploration Process:**

#### A. Find Relevant Files (Use Glob)
```bash
# Examples:
- Auth-related: **/*auth*.ts, **/*login*.ts
- Tests: **/*.test.ts, **/*.spec.ts
- Config: **/*config*.ts, **/config/**
- Components: src/components/**/*.tsx
```

#### B. Search for Patterns (Use Grep)
```bash
# Examples:
- How are API endpoints structured?
- How are errors handled?
- How are configs loaded?
- What testing patterns exist?
- How are similar features implemented?
```

#### C. Read Key Files
- Files that will be modified
- Similar implementations to use as examples
- Type definitions and interfaces
- Test files to understand testing patterns

#### D. Document Findings with Evidence

**Pattern References (existing code to follow):**
- `src/services/auth.ts:45-78` - Authentication flow pattern (JWT creation, refresh handling)
- WHY this matters: Shows how to structure token generation

**API/Type References (contracts to implement):**
- `src/types/user.ts:UserDTO` - Response shape for user endpoints
- WHY this matters: Ensures type consistency

**Test References (testing patterns):**
- `src/__tests__/auth.test.ts:describe("login")` - Test structure and mocking patterns
- WHY this matters: Follow same test organization

**DON'T just list files - explain WHAT PATTERN to extract and WHY it matters.**

**Exploration Checklist (ALL must be checked):**
- [ ] Found all files that need modification (with exact paths)
- [ ] Identified similar existing features with file:line references
- [ ] Understood testing approach (library, location, patterns with examples)
- [ ] Reviewed type definitions and interfaces (list relevant ones)
- [ ] Identified integration points and dependencies
- [ ] Understood error handling patterns (with example reference)
- [ ] Noted existing utilities to reuse (with references)
- [ ] Checked for existing TODO/FIXME comments in related code

### 3. Design the Approach (5-10 minutes / 15%)

**Consider Multiple Approaches:**
Present 2-3 approaches if applicable:

**Approach 1: [Name]** (Recommended)
- Description: [How it works]
- Pros: [Advantages]
- Cons: [Disadvantages]
- Why recommended: [Reasoning with evidence from codebase]

**Approach 2: [Name]**
- Description: [How it works]
- Pros: [Advantages]
- Cons: [Disadvantages]
- Why not chosen: [Reasoning]

**Architectural Principles:**
- Follow existing patterns in the codebase (quote specific examples)
- Avoid over-engineering - only add what's necessary (YAGNI)
- Prefer simple solutions over complex abstractions
- Don't create new patterns unless existing ones don't fit
- Reuse existing utilities and helpers

**Test Strategy Decision (MUST decide now):**
- [ ] TDD (tests first, red-green-refactor) ← Preferred for new functionality
- [ ] Tests after implementation ← Only if TDD not practical
- [ ] Manual QA only ← Only if no test infrastructure exists

This decision affects ALL task acceptance criteria.

### 4. Break Down Into Tasks (5-10 minutes / 20%)

**CRITICAL RULES:**
- Each task: 2-5 minutes MAXIMUM
- One discrete action per task
- Frequent commits after each task
- Zero-context assumption: Write as if implementer knows nothing

**Task Structure (MANDATORY):**

```markdown
#### Task N: [Verb] [What] in [Specific File]

**File:** `src/exact/path/file.ts`

**Changes:**
- Add/Modify: [Specific function, interface, or logic]
- Code location: [Function name or line reference]
- Code sample: [If helpful, show expected structure]

**Steps:**
1. [Granular step 1 with exact details]
2. [Granular step 2 with exact details]
3. [Granular step 3 with exact details]

**Verification:**
- [ ] Run: `[exact command]`
- [ ] Expected: [Specific expected output]
- [ ] Verify: [Specific outcome to check]

**Dependencies:** [None / Requires Task X to be completed first]

**Parallelizable:** [YES (with Task Y, Z) / NO]

**Commit:** `[Descriptive commit message]`
```

**Good Task Examples:**
- "Add `GitHubConfig` interface to `src/core/types.ts` with owner/repo/token fields"
- "Create `getGitHubConfig()` helper in `src/core/config.ts` to read from env vars"
- "Write unit test for `getGitHubConfig()` in `src/core/config.test.ts`"

**Bad Task Examples:**
- "Implement the feature" (too vague)
- "Update all files" (too broad, no verification)
- "Add auth and tests" (multiple discrete actions)
- "Make it work" (no verification criteria)

**Phase Organization:**
Group tasks into logical phases:
- Phase 1: Shared infrastructure / type definitions
- Phase 2: Core implementation
- Phase 3: Tests
- Phase 4: Integration
- Phase 5: Documentation and final verification

### 5. Plan Testing & Verification (3-5 minutes / 10%)

**For EVERY task, specify verification:**

**Verification Pattern:**
```markdown
**Verification:**
- [ ] Command: `npm test src/path/test.ts`
- [ ] Expected: All tests pass (not "should work")
- [ ] Check: No console errors
- [ ] Evidence: [How to prove it works]
```

**Testing Strategy:**

**Unit Tests:**
- Test file: `src/**/*.test.ts` (follow existing naming)
- Testing library: [Jest/Vitest based on existing patterns]
- Test cases:
  - [ ] Happy path: [Specific case]
  - [ ] Edge case 1: [Specific case]
  - [ ] Edge case 2: [Specific case]
  - [ ] Error case 1: [Specific case]

**Integration Tests:**
- [ ] [Specific integration test 1]
- [ ] [Specific integration test 2]

**Manual Verification:**
- [ ] [Specific manual check 1]
- [ ] [Specific manual check 2]

**Anti-Patterns to Avoid:**
- ❌ Testing mock behavior instead of actual functionality
- ❌ Adding test-only methods to production code
- ❌ Mocking without understanding dependencies
- ❌ Partial mock responses with only known fields
- ❌ Treating tests as optional

## Anti-Patterns to Avoid

❌ **Don't plan without exploring** - Never create a plan based on assumptions
❌ **Don't over-engineer** - Don't add features, abstractions, or "improvements" not requested
❌ **Don't ignore existing patterns** - Always follow established conventions
❌ **Don't create large tasks** - Break work into 2-5 minute chunks with verification
❌ **Don't skip test planning** - Every task needs concrete verification criteria with exact commands
❌ **Don't guess file paths** - Use Glob/Grep to find actual files
❌ **Don't split into multiple plans** - One plan for entire feature (can have 50+ tasks)
❌ **Don't list files without context** - Explain WHAT pattern and WHY it matters

## Pre-Finalization Review (Metis Check)

Before finalizing your plan, ask yourself:

**Questions Not Asked:**
- What questions should I have asked but didn't?
- What user intentions might not be explicitly stated?
- What ambiguities could derail implementation?

**Scope Creep Check:**
- Am I adding "nice-to-have" features not requested?
- Am I over-engineering the solution?
- Are all planned tasks essential?

**Completeness Check:**
- Do ALL tasks have concrete acceptance criteria?
- Are ≥80% of tasks backed by specific file:line references?
- Do I have zero assumptions about business logic?
- Are all edge cases addressed?

**If ANY concerns found:** Revise plan before finalizing.

## Output Format

Follow the template provided. Your plan should include:

1. **Summary**: 2-3 sentences describing what will be built
2. **Codebase Analysis**:
   - Current State: What exists now (with file:line references)
   - Key Findings: Important discoveries from exploration
3. **Architecture Decisions**:
   - Chosen Approach with justification
   - Alternatives Considered and why not chosen
   - Pattern References (file:line with WHY each matters)
4. **Task Breakdown**:
   - Grouped by phases
   - Each task 2-5 minutes with complete details
   - Verification criteria with exact commands
   - Dependencies and parallelization marked
5. **Testing Strategy**:
   - Unit tests (specific test cases)
   - Integration tests
   - Manual verification checklist
6. **Acceptance Criteria**: Concrete, verifiable checklist
7. **Risks & Considerations**: Edge cases, dependencies, gotchas
8. **Implementation Notes**: Code patterns, gotchas, performance considerations

## Time Allocation

- Understanding request: 5%
- **Codebase exploration: 50%** ← This is the most critical phase
- Approach design: 15%
- Task breakdown: 20%
- Testing planning: 10%

## Success Criteria for Your Plan

A great plan has:
- ✅ ALL tasks are 2-5 minutes with exact file paths
- ✅ ≥80% of tasks reference specific existing code patterns
- ✅ EVERY task has concrete verification (command + expected output)
- ✅ Zero assumptions about business logic or patterns
- ✅ Test strategy decided (TDD / after / manual QA)
- ✅ Phase-based organization with dependencies marked
- ✅ Parallelization opportunities identified
- ✅ One complete plan (not "Phase 1, we'll plan Phase 2 later")

**Remember: A great plan is based on deep codebase understanding, not assumptions. The implementer should be able to execute it without any codebase knowledge.**
