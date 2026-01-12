---
id: flip-fd-exhaustion
steps: [verify]
parent: null
children: []
open_questions: []
learn:
  - flip was launched via AppleScript with nohup background execution causing zombie processes
  - chokidar creates file watchers for all directories recursively
  - ENFILE error causes server to become unresponsive
  - Shell keybinding approach is simpler and avoids zombie process issue
feedback: []
---

# Fix: Flip File Descriptor Exhaustion

## Bug Summary

**Symptom**: flip 열고 잠시 후 cancel과 file API가 pending 상태로 응답하지 않음. 파일이 열리지도 않고 창이 닫히지도 않음.

**Error Log**: `/tmp/flip.log`에서 18,000줄 이상의 `ENFILE: file table overflow` 에러 반복

## Root Cause Analysis

### Five Whys

1. **Why**: cancel/file API가 pending → 서버가 ENFILE 에러로 정상 동작 불가
2. **Why**: ENFILE 에러 발생 → 시스템 FD 한도 초과
3. **Why**: FD 소진 → 이전 flip 인스턴스들이 FD 정리 없이 남아있음
4. **Why**: 정리 안 됨 → `nohup ... &` 백그라운드 실행으로 종료 시그널 못 받음
5. **Why**: 여러 인스턴스 → 핫키 반복 실행 시 기존 프로세스 종료 안 됨

## Implementation (Completed)

### 1. Shell-based Hotkey Setup (New Approach)

**File**: `packages/cli/src/flip/index.ts`

기존 iTerm2 coprocess + AppleScript 방식을 shell keybinding으로 교체:
- `Alt+;` (Option+;)로 `csq flip` 실행
- zsh: `bindkey -s '\e;' 'csq flip\n'`
- bash: `bind '"\e;":"csq flip\n"'`

**Benefits**:
- 더 간단한 설정 (shell config에 한 줄 추가)
- 터미널이 프로세스 관리 → 좀비 프로세스 없음
- iTerm2 외 다른 터미널에서도 동작

### 2. ENFILE Error Handling

**File**: `packages/cli/src/flip/watcher/FileWatcher.ts`

```typescript
.on('error', (error) => {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENFILE' || code === 'EMFILE') {
        console.error('File descriptor limit reached. Disabling file watcher.');
        this.stop();
    } else {
        console.error('Watcher error:', error);
    }
});
```

**Benefits**:
- FD 고갈 시 무한 에러 로그 방지
- 기본 기능(파일 보기, 코멘트)은 계속 동작

## Changed Files

1. `packages/cli/src/flip/index.ts` - `setupHotkey()` 함수 전면 교체
2. `packages/cli/src/flip/watcher/FileWatcher.ts` - ENFILE 에러 핸들링

## Validation Checklist

- [x] 빌드 성공
- [ ] `csq flip setup` 실행하여 shell config에 추가 확인
- [ ] `source ~/.zshrc` 후 Alt+; 동작 확인
- [ ] flip 정상 동작 확인 (파일 열기, cancel, submit)
- [ ] FD 고갈 상황 시뮬레이션 (선택)
