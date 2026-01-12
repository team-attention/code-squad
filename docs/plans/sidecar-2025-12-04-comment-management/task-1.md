# Task 1: Repository Layer Changes

**Phase**: 1 - Comment Lifecycle
**Dependencies**: None
**Files**: 2

## Objective

Add `update()` and `delete()` methods to the comment repository interface and implementation.

## Files to Modify

### 1. `src/application/ports/outbound/ICommentRepository.ts`

Add two new methods to the interface:

```typescript
export interface ICommentRepository {
  // existing methods...
  save(comment: Comment): Promise<void>;
  findAll(): Promise<Comment[]>;
  findActive(): Promise<Comment[]>;
  markAsSubmitted(ids: string[]): Promise<void>;

  // NEW methods
  update(id: string, text: string): Promise<Comment | null>;
  delete(id: string): Promise<boolean>;
}
```

### 2. `src/infrastructure/repositories/JsonCommentRepository.ts`

Implement the new methods:

```typescript
async update(id: string, text: string): Promise<Comment | null> {
  const index = this.comments.findIndex(c => c.id === id);
  if (index === -1) {
    return null;
  }

  // Create updated comment (Comment entity is immutable, create new instance)
  const existing = this.comments[index];
  const updated = Comment.create({
    file: existing.file,
    line: existing.line,
    endLine: existing.endLine,
    text: text,
    codeContext: existing.codeContext,
  });
  // Preserve original id and timestamp
  // Note: May need to add a Comment.withId() factory or modify create()

  this.comments[index] = updated;
  await this.persist();
  return updated;
}

async delete(id: string): Promise<boolean> {
  const index = this.comments.findIndex(c => c.id === id);
  if (index === -1) {
    return false;
  }

  this.comments.splice(index, 1);
  await this.persist();
  return true;
}
```

## Implementation Notes

1. **Comment Entity Immutability**: The `Comment` entity uses private state. For `update()`, we need to either:
   - Option A: Add a `Comment.createWithId()` factory method to preserve ID
   - Option B: Add a `withText()` method to Comment that returns new instance
   - Option C: Modify existing comment in-place (breaks immutability)

   Recommended: **Option A** - Add factory method to preserve ID/timestamp

2. **Domain Change** (minimal): Add to `src/domain/entities/Comment.ts`:
   ```typescript
   static createWithId(id: string, timestamp: number, input: CommentInput): Comment {
     const comment = new Comment();
     comment.state = { ...input, id, timestamp, isSubmitted: false };
     return comment;
   }
   ```

3. **Persist on change**: Both methods must call `persist()` to save to JSON file.

4. **Return values**:
   - `update()`: Returns updated Comment or null if not found
   - `delete()`: Returns boolean success indicator

## Validation

- [ ] `ICommentRepository` interface has `update()` and `delete()` methods
- [ ] `JsonCommentRepository` implements both methods
- [ ] `Comment.createWithId()` factory method added
- [ ] Changes persist to `.vscode/sidecar-comments.json`
- [ ] TypeScript compiles without errors

## Test Scenarios

1. Update existing comment text → returns updated comment
2. Update non-existent comment → returns null
3. Delete existing comment → returns true, comment removed
4. Delete non-existent comment → returns false
