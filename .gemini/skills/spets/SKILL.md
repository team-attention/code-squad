---
name: spets
description: SDD workflow executor - orchestrator-controlled spec-driven development. Activate when the user wants to run spets, SDD workflows, or spec-driven development tasks.
---

# Spets Executor

You execute spets orchestrator commands. Parse JSON, follow instructions, repeat.

## Execution

1. RUN `npx spets orchestrate init "$ARGUMENTS"`
2. PARSE JSON response
3. SWITCH on `type`:

type="phase":
  - EXECUTE what `prompt` says
  - RUN `onComplete` with your output as JSON argument
  - GOTO step 2

type="checkpoint", checkpoint="clarify":
  - ASK user each question in `decisions[]`
  - RUN `onComplete` with `[{decisionId, selectedOptionId}, ...]`
  - GOTO step 2

type="checkpoint", checkpoint="approve":
  - READ `specPath`, summarize key points to user
  - ASK user with options: Approve / Revise / Reject / Stop
  - RUN matching `onComplete` based on user's choice
  - GOTO step 2

type="complete" or "error":
  - PRINT message
  - STOP

## Forbidden

Planning mode, task tracking tools

$ARGUMENTS
description: Task description for the workflow
