# Task 5: Add "Attach to Worktree" Button to Webview

## Goal

Add an "Attach to Worktree" button to the ThreadListWebview UI and wire it to send a message to the controller.

## Location

`src/adapters/inbound/ui/ThreadListWebviewProvider.ts`

## Changes

### 1. Add onAttachToWorktree Callback to Constructor

Modify constructor parameters:

```typescript
constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly getSessions: () => Map<string, SessionContext>,
    private readonly onSelectThread: (id: string) => void,
    private readonly onCreateThread: (options: CreateThreadOptions) => void,
    private readonly onOpenNewTerminal: (id: string) => void,
    private readonly onAttachToWorktree: () => void  // NEW
) {}
```

### 2. Add Message Handler

In `resolveWebviewView()` method, add message handling for 'attachToWorktree':

```typescript
webviewView.webview.onDidReceiveMessage((message) => {
    switch (message.type) {
        case 'webviewReady':
            // ... existing code
            break;
        case 'selectThread':
            this.onSelectThread(message.id);
            break;
        case 'createThread':
            this.onCreateThread({
                name: message.name,
                isolationMode: message.isolationMode,
                branchName: message.branchName,
                worktreePath: message.worktreePath,
            });
            break;
        case 'attachToWorktree':  // NEW
            this.onAttachToWorktree();
            break;
        case 'openNewTerminal':
            this.onOpenNewTerminal(message.id);
            break;
    }
});
```

### 3. Add Button to HTML

In `getHtmlContent()` method, add the "Attach to Worktree" button after the "Start Thread" button:

Find this section (around line 210):

```html
<button class="submit-button" id="startBtn">Start Thread</button>
```

Add immediately after:

```html
<button class="submit-button secondary-button" id="attachBtn">Attach to Worktree</button>
```

### 4. Add Button Styling

In the `<style>` section, add styles for the secondary button:

```css
.submit-button.secondary-button{
    background:var(--vscode-button-secondaryBackground);
    color:var(--vscode-button-secondaryForeground);
    margin-top:4px;
}
.submit-button.secondary-button:hover{
    background:var(--vscode-button-secondaryHoverBackground);
}
```

### 5. Add Button Click Handler

In the `<script>` section, add event listener for the attach button:

After the existing `startBtn` click handler (around line 302), add:

```javascript
// Attach to worktree
$('attachBtn').addEventListener('click', () => {
    vscode.postMessage({ type: 'attachToWorktree' });
});
```

## Test Scenarios

### TS1: Button Renders in UI

**Given**: ThreadListWebview is displayed
**When**: "New Thread" section is visible
**Then**: "Start Thread" button is shown
**And**: "Attach to Worktree" button is shown below it
**And**: Attach button has secondary styling (different background color)

### TS2: Button Click Sends Message

**Given**: Webview is ready
**When**: User clicks "Attach to Worktree" button
**Then**: Message `{ type: 'attachToWorktree' }` is sent to extension
**And**: `onAttachToWorktree()` callback is invoked

### TS3: Message Handler Routes Correctly

**Given**: Webview receives message `{ type: 'attachToWorktree' }`
**When**: Message is processed
**Then**: `onAttachToWorktree()` callback is called
**And**: No other callbacks are triggered

### TS4: Button Styling Matches Design

**Given**: VSCode theme is loaded
**When**: Webview is rendered
**Then**: Attach button uses `--vscode-button-secondaryBackground`
**And**: Hover state uses `--vscode-button-secondaryHoverBackground`
**And**: Button has 4px top margin (slight separation from Start Thread)

### TS5: Callback Integration

**Given**: ThreadListWebviewProvider is constructed with `onAttachToWorktree` callback
**When**: User clicks attach button
**Then**: Callback is invoked
**And**: ThreadListController.attachToWorktree() is executed

## Acceptance Criteria

- [ ] `onAttachToWorktree` callback is added to constructor
- [ ] Message handler processes 'attachToWorktree' message type
- [ ] "Attach to Worktree" button is added to HTML
- [ ] Button is positioned below "Start Thread" button
- [ ] Button has secondary styling (secondary background color)
- [ ] Button click sends `{ type: 'attachToWorktree' }` message
- [ ] Message handler invokes `onAttachToWorktree()` callback
- [ ] CSS styling is added for `.secondary-button`
- [ ] JavaScript click handler is added for `attachBtn`
- [ ] No console errors when clicking button

## Implementation Notes

### Button Placement

The button should be in the "New Thread" section, immediately after the "Start Thread" button. This makes it clear that both buttons are related to thread creation/attachment.

### Visual Hierarchy

Use VSCode's secondary button colors to visually distinguish "Attach to Worktree" as an alternative action to "Start Thread":
- Primary action (Start Thread): `--vscode-button-background`
- Secondary action (Attach to Worktree): `--vscode-button-secondaryBackground`

### Message Flow

```
User clicks button
    ↓
JavaScript: vscode.postMessage({ type: 'attachToWorktree' })
    ↓
TypeScript: webviewView.webview.onDidReceiveMessage(message)
    ↓
TypeScript: this.onAttachToWorktree()
    ↓
ThreadListController: attachToWorktree()
```

### No Form State

Unlike "Start Thread", the attach button does not need any form inputs. It triggers an interactive flow (Quick Pick + Input Box) managed by the controller.

## Files to Modify

- `src/adapters/inbound/ui/ThreadListWebviewProvider.ts`

## Estimated Time

20 minutes
