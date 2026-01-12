# Task 12: Update SidecarPanelAdapter for Thread Context

## Scope

Update the panel adapter to display thread-scoped comments and handle thread context.

## Deliverables

1. Update `src/adapters/inbound/ui/SidecarPanelAdapter.ts` - Thread context handling
2. Update webview components for thread-aware display

## Technical Design

```typescript
// src/adapters/inbound/ui/SidecarPanelAdapter.ts
export class SidecarPanelAdapter {
  private currentThreadId: string | undefined;

  setThreadContext(threadId: string | undefined): void {
    this.currentThreadId = threadId;
    this.refreshPanel();
  }

  async getCommentsForCurrentThread(): Promise<Comment[]> {
    return this.commentRepository.findAll(this.currentThreadId);
  }

  async getCommentsForFile(filePath: string): Promise<Comment[]> {
    return this.commentRepository.findByFile(filePath, this.currentThreadId);
  }

  // Update addComment to include threadId
  async addComment(data: { filePath: string; startLine: number; endLine: number; text: string }): Promise<void> {
    const comment = Comment.create({
      ...data,
      threadId: this.currentThreadId,
    });
    await this.commentRepository.save(comment);
    this.refreshPanel();
  }

  // Update submitComments to send to correct terminal
  async submitComments(): Promise<void> {
    const comments = await this.getCommentsForCurrentThread();
    if (comments.length === 0) return;

    const sessionContext = this.getCurrentSessionContext();
    if (!sessionContext) return;

    const terminalId = sessionContext.threadState?.terminalId
      ?? sessionContext.session.terminalId;

    const text = this.formatCommentsForTerminal(comments);
    await this.terminalPort.sendText(terminalId, text);

    // Delete submitted comments
    await Promise.all(comments.map(c => this.commentRepository.delete(c.id)));
    this.refreshPanel();
  }

  // Panel state message for webview
  getPanelState(): PanelState {
    return {
      // existing fields...
      currentThreadId: this.currentThreadId,
      threadName: this.getCurrentThreadName(),
    };
  }
}
```

```typescript
// Webview update - src/adapters/inbound/ui/webview/components/sidebar/AIStatus.ts
export function renderThreadContext(threadName: string | undefined): string {
  if (!threadName) return '';
  return `
    <div class="thread-context">
      <span class="thread-indicator">●</span>
      <span class="thread-name">${escapeHtml(threadName)}</span>
    </div>
  `;
}
```

## Test Scenarios

### TS12.1: Set Thread Context

**Given**: Panel showing "All Agents" view
**When**: setThreadContext("thread-1")
**Then**:
- currentThreadId set to "thread-1"
- Panel refreshes with thread-1's data

### TS12.2: Get Comments for Specific Thread

**Given**: 5 comments total, 3 for thread-1
**When**: getCommentsForCurrentThread() with currentThreadId="thread-1"
**Then**: Returns 3 comments

### TS12.3: Get Comments for All Agents View

**Given**: 5 comments total
**When**: getCommentsForCurrentThread() with currentThreadId=undefined
**Then**: Returns all 5 comments

### TS12.4: Add Comment with Thread Association

**Given**: currentThreadId="thread-1"
**When**: addComment({ filePath: "x.ts", startLine: 1, endLine: 1, text: "fix" })
**Then**: Comment saved with threadId="thread-1"

### TS12.5: Add Comment in All Agents View

**Given**: currentThreadId=undefined (All Agents view)
**When**: addComment({ ... })
**Then**: Comment saved with threadId=undefined (global comment)

### TS12.6: Submit Comments to Correct Terminal

**Given**: Thread-1 has terminal "term-1", comments for thread-1
**When**: submitComments() called
**Then**: Comments sent to "term-1"

### TS12.7: Submit Comments from All Agents View

**Given**: All Agents view selected, mixed comments
**When**: submitComments() called
**Then**: Error or warning (cannot submit in aggregate view)

### TS12.8: Panel State Includes Thread Info

**Given**: currentThreadId="thread-1", threadName="fix-bug"
**When**: getPanelState()
**Then**: State includes currentThreadId and threadName

### TS12.9: Thread Context Display in Header

**Given**: Thread "fix-bug" selected
**When**: Panel renders
**Then**: Header shows "● fix-bug" thread indicator

## Files to Modify

| File | Action |
|------|--------|
| `src/adapters/inbound/ui/SidecarPanelAdapter.ts` | MODIFY - thread context |
| `src/adapters/inbound/ui/webview/components/sidebar/AIStatus.ts` | MODIFY - thread display |
| `src/application/ports/outbound/PanelState.ts` | MODIFY - add thread fields |

## Dependencies

- Task 8: Comment with threadId
- Task 9: CommentRepository thread filtering
- Task 10: ManageWhitelistUseCase
- Task 11: FileWatchController per-thread whitelist

## Notes

- "All Agents" view has undefined threadId
- Comments created in All Agents view are global (no threadId)
- Submit comments disabled in All Agents view (or sends to active terminal)
- Thread indicator shows current context in panel header
