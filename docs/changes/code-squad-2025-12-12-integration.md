# Changes: Code Squad Integration

**Date**: 2025-12-13
**Slug**: code-squad-2025-12-12-integration

## Summary

Implemented Code Squad multi-agent thread management system with TreeDataProvider-based Activity Bar integration.

## Changes by Task

### Task 1: AgentConfig Entity and AgentConfigRegistry

**Files Added**:
- `src/domain/entities/AgentConfig.ts` - Agent configuration interface and types
- `src/domain/services/AgentConfigRegistry.ts` - Registry for agent configurations
- `src/test/domain/services/AgentConfigRegistry.test.ts` - Unit tests

**Exports Updated**:
- `src/domain/entities/index.ts` - Added AgentConfig exports
- `src/domain/services/index.ts` - Added AgentConfigRegistry export

### Task 2: DeleteThreadUseCase

**Files Added**:
- `src/application/useCases/thread/DeleteThreadUseCase.ts` - Delete thread use case
- `src/test/application/useCases/thread/DeleteThreadUseCase.test.ts` - Unit tests

**Exports Updated**:
- `src/application/useCases/thread/index.ts` - Added DeleteThreadUseCase export

### Task 3: RestoreSessionUseCase

**Files Added**:
- `src/application/useCases/thread/RestoreSessionUseCase.ts` - Session restore use case
- `src/test/application/useCases/thread/RestoreSessionUseCase.test.ts` - Unit tests

**Interfaces Updated**:
- `src/application/ports/inbound/IThreadUseCase.ts` - Added IRestoreSessionUseCase interface

**Exports Updated**:
- `src/application/useCases/thread/index.ts` - Added RestoreSessionUseCase export

### Task 4: ThreadTreeProvider

**Files Added**:
- `src/adapters/inbound/ui/ThreadTreeProvider.ts` - TreeDataProvider for Activity Bar

**Features**:
- ThreadTreeItem with status-based icons
- EmptyStateItem for when no threads exist
- Auto-refresh on thread events
- Sorting (running threads first)
- Click actions based on thread status

### Task 5: ThreadController and package.json

**Files Added**:
- `src/adapters/inbound/controllers/ThreadController.ts` - Command handlers

**Files Modified**:
- `package.json` - Added views, commands, and menus for thread management

**Commands Added**:
- `codeSquad.createThread` - Create new thread with agent selection
- `codeSquad.startThread` - Start idle/stopped thread
- `codeSquad.stopThread` - Stop running thread
- `codeSquad.restartThread` - Restart running thread
- `codeSquad.deleteThread` - Delete stopped thread
- `codeSquad.focusThread` - Focus thread's terminal
- `codeSquad.selectThread` - Select thread for review panel

**Views Added**:
- `codeSquadThreads` - Tree view in Code Squad Activity Bar

**DI Wiring Updated**:
- `src/extension.ts` - Added thread-related imports, instantiation, and registration

### Task 6: Thread-Review Panel Integration

**Files Modified**:
- `src/adapters/inbound/controllers/ThreadController.ts` - Added selectThread command handler
- `src/adapters/inbound/ui/ThreadTreeProvider.ts` - Click on running thread calls selectThread
- `package.json` - Added selectThread command and context menu entry

## Test Results

All new tests pass:
- AgentConfigRegistry: 8 tests passing
- DeleteThreadUseCase: 5 tests passing
- RestoreSessionUseCase: 5 tests passing

Total: 140 tests passing (1 pre-existing failure in ScopeMappingService unrelated to these changes)

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Inbound Adapters                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌──────────────────────────────────┐  │
│  │ ThreadTreeProvider  │  │        ThreadController          │  │
│  │ (Activity Bar)      │  │    (Command handlers)            │  │
│  └─────────┬───────────┘  └──────────────┬───────────────────┘  │
│            │                              │                      │
└────────────┼──────────────────────────────┼──────────────────────┘
             │ Use Cases                    │
┌────────────┴──────────────────────────────┴──────────────────────┐
│                        Application Layer                          │
├──────────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐  │
│  │ Create   │ │ Start    │ │ Stop    │ │ Delete  │ │ Restore  │  │
│  │ Thread   │ │ Thread   │ │ Thread  │ │ Thread  │ │ Session  │  │
│  └──────────┘ └──────────┘ └─────────┘ └─────────┘ └──────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │              IAgentRuntimePort                            │    │
│  │              IThreadStateRepository                       │    │
│  └──────────────────────────────────────────────────────────┘    │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────┴─────────────────────────────────────┐
│                       Domain / Infrastructure                     │
├──────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────┐  ┌───────────────────────────────┐   │
│  │   AgentConfig          │  │ JsonThreadStateRepository     │   │
│  │   AgentConfigRegistry  │  │ CodeSquadRuntimeAdapter       │   │
│  └────────────────────────┘  └───────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

## Next Steps

- `/review code-squad-2025-12-12-integration` - Review implementation and sync knowledge base
