# Task 2: Use Cases

**Phase**: 1 - Comment Lifecycle
**Dependencies**: Task 1
**Files**: 4

## Objective

Create `EditCommentUseCase` and `DeleteCommentUseCase` following existing patterns.

## Files to Create

### 1. `src/application/ports/inbound/IEditCommentUseCase.ts`

```typescript
import { Comment } from '../../../domain/entities/Comment';

export interface EditCommentInput {
  id: string;
  text: string;
}

export interface IEditCommentUseCase {
  execute(input: EditCommentInput): Promise<Comment | null>;
}
```

### 2. `src/application/ports/inbound/IDeleteCommentUseCase.ts`

```typescript
export interface DeleteCommentInput {
  id: string;
}

export interface IDeleteCommentUseCase {
  execute(input: DeleteCommentInput): Promise<boolean>;
}
```

### 3. `src/application/useCases/EditCommentUseCase.ts`

```typescript
import { Comment } from '../../domain/entities/Comment';
import { ICommentRepository } from '../ports/outbound/ICommentRepository';
import { EditCommentInput, IEditCommentUseCase } from '../ports/inbound/IEditCommentUseCase';

export class EditCommentUseCase implements IEditCommentUseCase {
  constructor(private readonly commentRepository: ICommentRepository) {}

  async execute(input: EditCommentInput): Promise<Comment | null> {
    const { id, text } = input;

    // Validate text is not empty
    if (!text.trim()) {
      return null;
    }

    return this.commentRepository.update(id, text.trim());
  }
}
```

### 4. `src/application/useCases/DeleteCommentUseCase.ts`

```typescript
import { ICommentRepository } from '../ports/outbound/ICommentRepository';
import { DeleteCommentInput, IDeleteCommentUseCase } from '../ports/inbound/IDeleteCommentUseCase';

export class DeleteCommentUseCase implements IDeleteCommentUseCase {
  constructor(private readonly commentRepository: ICommentRepository) {}

  async execute(input: DeleteCommentInput): Promise<boolean> {
    const { id } = input;
    return this.commentRepository.delete(id);
  }
}
```

## Pattern Reference

Follow existing use case pattern from `AddCommentUseCase`:
- Constructor injection of repository
- Implements interface from `ports/inbound/`
- Single `execute()` method
- Returns domain entity or result indicator

## Architecture Compliance

- [ ] No `vscode` imports in application layer
- [ ] Use cases depend only on ports (interfaces)
- [ ] Input/Output types defined in port interface files
- [ ] Follow naming convention: `{Action}CommentUseCase.ts`

## Validation

- [ ] `IEditCommentUseCase` interface created
- [ ] `IDeleteCommentUseCase` interface created
- [ ] `EditCommentUseCase` implements interface
- [ ] `DeleteCommentUseCase` implements interface
- [ ] TypeScript compiles without errors
- [ ] No vscode imports in these files

## Test Scenarios

### EditCommentUseCase
1. Edit with valid text → returns updated Comment
2. Edit with empty text → returns null (validation)
3. Edit non-existent ID → returns null (from repository)

### DeleteCommentUseCase
1. Delete existing comment → returns true
2. Delete non-existent comment → returns false
