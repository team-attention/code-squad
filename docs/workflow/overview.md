# Workflow System (Siat)

## Goals

1. **Clean Context** - Load only what's needed per step
2. **Cumulative Knowledge** - Continuously update during work
3. **Improvable Workflow** - Record friction, get feedback in review
4. **State Management** - Track progress with state.yml

---

## Workflow Phases

```
(/siat:do brainstorm) → /siat:do spec → /siat:do plan → /siat:do implement → /siat:do review
         ↑
      optional
```

| Phase | What | Output |
|-------|------|--------|
| brainstorm | Problem discovery (optional) | docs/brainstorms/{topic}.md |
| spec | Define requirements + **Use Cases** | docs/specs/{slug}.md |
| plan | Technical design + **Test Scenarios** + task breakdown | docs/plans/{slug}/ |
| implement | **TDD** with test scenarios → implementation | code + docs/changes/{slug}.md |
| review | Evaluate results + sync KB | Add review to changes document |

### Use Case → Test → Code Flow

```
spec: Use Cases (Actor, Trigger, Flow, Business Rules, Location)
   │
   ├── Defines "what the feature does" in natural language
   └── Maps to code: `{Action}UseCase` implementing `I{Action}Port`
   │
   ▼
plan: Test Scenarios (derived from Use Cases)
   │
   ├── Happy path, edge cases, error cases
   ├── Given/When/Then format (pseudo-code)
   └── Specifies what to mock (repositories, APIs)
   │
   ▼
implement: TDD
   │
   ├── Write test for scenario → implement → pass
   └── Repeat for each test scenario
```

**Utility Commands** (독립적으로 사용):

| Command | What |
|---------|------|
| `/siat:do fix` | Research + fix + self-review |
| `/siat:do friction` | Record workflow friction immediately |
| `/siat:do retro` | Analyze friction + improve workflow |

---

## Siat Structure

```
.claude/siat/
├── config.yml           # Workflow configuration
├── state.yml            # Current progress (auto-generated)
├── steps/               # Step definitions
│   ├── brainstorm/
│   │   ├── instruction.md   # How to execute this step
│   │   └── spec.md          # Output template
│   ├── spec/
│   ├── plan/
│   ├── implement/
│   ├── review/
│   ├── fix/             # Standalone utility
│   ├── friction/        # Standalone utility
│   └── retro/           # Standalone utility
└── specs/               # Step outputs (auto-generated)
```

### Step File Structure

Each step has:
- **instruction.md**: How to execute the step (inputs, outputs, approval)
- **spec.md**: Template for the step output

---

## Document Structure

```
docs/
├── rules/                      # Project rules (Architecture, Structure)
│   ├── OVERVIEW.md             # Project overview
│   ├── CLEAN_ARCHITECTURE.md   # Architecture rules
│   └── CODE_STRUCTURE_MAP.md   # File placement rules
│
├── specs/                      # Feature specifications
├── plans/                      # Implementation plans
├── changes/                    # Change logs
├── brainstorms/                # Brainstorm results
│
└── workflow/
    ├── overview.md             # This document
    └── friction.md             # Friction records
```

---

## Context Loading per Phase

| Phase | Load | Don't Load |
|-------|------|-----------|
| brainstorm | docs/rules/OVERVIEW.md | Code details |
| spec | OVERVIEW.md, CLEAN_ARCHITECTURE.md | Other specs |
| plan | rules/ + spec | Other plans |
| implement | task doc only | entire overview, other tasks |
| fix | docs/overview.md + problem area code | unrelated areas |
| review | changes doc + code diff | exploration results |

---

## State Management

Siat automatically tracks progress in `.claude/siat/state.yml`:

```yaml
current_run:
  request: "사용자 요청 내용"
  current_step: "plan"
  started_at: "2024-01-01T00:00:00Z"

steps:
  brainstorm:
    status: "skipped"
  spec:
    status: "completed"
    artifact: ".claude/siat/specs/{task-slug}/spec.md"
  plan:
    status: "in_progress"
  implement:
    status: "pending"
  review:
    status: "pending"
```

---

## Feedback & Improvement

### In review step

**MUST ask user feedback**:
- "Please review the implementation. How do you evaluate it?"
- Incorporate user feedback into Changes document

Add to end of Changes document:

```markdown
## Review

### Evaluation
- ✅/❌ Checklist

### User Feedback
- User evaluation result
- User feedback (if any)

### Feedback
- What went well
- What could be improved

### Friction
- Record if workflow friction discovered

### Next Actions
- Follow-up tasks
```

### Improvement Cycle

```
Friction occurs during work
      ↓
Record via /siat:do friction (or in review step)
      ↓
Accumulated in friction.md
      ↓
Periodically run /siat:do retro
      ↓
Analyze patterns → Modify steps/skills
      ↓
Verify effectiveness in next work
```

---

## Principles

1. **Steps are self-contained** - Each step has instruction + template
2. **Context isolation** - Load only what's needed per step
3. **Skills are rules** - Auto-activated guidelines
4. **Update KB while working** - Sync docs/rules/ after review
5. **Record friction** - Log when discovered, improve periodically
6. **State tracking** - Know where you are in the workflow
