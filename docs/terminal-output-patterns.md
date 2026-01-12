# Terminal Output Patterns

AI CLI 도구들의 터미널 출력 패턴 정리. `execution.read()`로 캡처되는 TUI 출력 기준.

## Claude Code

### Idle 상태
```
╭──────────────────────────────────────────────────────────────────────────────╮
│ >                                                                    -- INSERT -- │
╰──────────────────────────────────────────────────────────────────────────────╯
```

특징:
- `-- INSERT --` 또는 `-- NORMAL --` 모드 표시
- `>` 프롬프트 (빈 상태)

### Working 상태
```
∴ Imagining… (esc to interrupt · 0s)
```

```
∴ Thinking…

I'll help you with that task.
```

```
⠋ Bash(sleep 5)                                                Running…
```

특징:
- `esc to interrupt` 텍스트
- `∴ Thinking…` 또는 `Imagining…`
- 스피너 (`⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏`) + `Running…`

### Waiting 상태 (사용자 입력 필요)
```
Do you want to make this edit?
  1. Yes
  2. No
  Esc to cancel
```

```
Do you want to proceed? (y/n)
```

특징:
- `Esc to cancel` (대문자 E)
- `Do you want to` 질문
- `(y/n)` 또는 `[Y/n]` 프롬프트
- 번호 선택 메뉴 (`1. Yes`)

---

## Gemini CLI

### Idle 상태
```
╭──────────────────────────────────────────────────────────────────╮
│ >   Type your message or @path/to/file                           │
╰──────────────────────────────────────────────────────────────────╯
~/Workspace/project (main*)      no sandbox       auto
```

```
Tips for getting started:
1. Ask questions, edit files, or run commands.
2. Be specific for the best results.
3. /help for more information.
```

특징:
- `> Type your message` 프롬프트
- `Tips for getting started` (초기 시작 화면)

### Working 상태
```
✦ I'm Feeling Lucky
(esc to cancel, 0s)
```

```
✦ Initiating Execution Strategy
(esc to cancel, 5s)
```

```
✦ Add content to the instructional memory with /memory
(esc to cancel, 0s)
```

특징:
- `(esc to cancel, Ns)` 형식 (소문자 esc, 시간 포함)
- `✦` 스피너 아이콘

### Waiting 상태 (사용자 입력 필요)
```
╭──────────────────────────────────────────────────────────────────╮
│ ?  Shell sleep 5s [current working directory /Users/...]       ▶ │
│                                                                   │
│ sleep 5s                                                          │
│                                                                   │
│ Allow execution of: 'sleep'?                                      │
│                                                                   │
│ ▶ 1. Yes, allow once                                              │
│   2. Yes, allow always ...                                        │
│   3. No, suggest changes (esc)                                    │
│                                                                   │
╰──────────────────────────────────────────────────────────────────╯
```

```
✦ Waiting for user confirmation...
```

특징:
- `1. Yes, allow once` 메뉴
- `Allow execution of:` 질문
- `Waiting for user confirmation`
- `suggest changes` 옵션

---

## 패턴 매칭 규칙

### 우선순위
1. **waiting** (priority 2) - 사용자 입력 필요, 가장 먼저 체크
2. **working** (priority 1) - AI가 작업 중
3. **idle** (priority 0) - 입력 대기 상태

### Claude 패턴
| 상태 | 패턴 | 정규식 |
|------|------|--------|
| waiting | `Esc to cancel` | `/Esc to cancel/i` |
| waiting | `Do you want to` | `/Do you want to/i` |
| waiting | `(y/n)` | `/\(y\/n\)/i` |
| waiting | `1. Yes` | `/>\s*1\.\s*Yes/i` |
| working | `esc to interrupt` | `/Esc to interrupt/i` |
| idle | `-- INSERT --` | `/--\s*INSERT\s*--/` |
| idle | `-- NORMAL --` | `/--\s*NORMAL\s*--/` |
| idle | `> ` (프롬프트) | `/^>\s*$/` |

### Gemini 패턴
| 상태 | 패턴 | 정규식 |
|------|------|--------|
| waiting | `1. Yes, allow once` | `/1\.\s*Yes,\s*allow once/i` |
| waiting | `Waiting for user` | `/Waiting for user/i` |
| waiting | `suggest changes` | `/suggest changes/i` |
| waiting | `Yes, allow` | `/Yes, allow/i` |
| working | `(esc to cancel` | `/esc to cancel/i` |
| idle | `Type your message` | `/>\s*Type your message/i` |
| idle | `Tips for getting started` | `/Tips for getting started/i` |

---

## 주의사항

### Claude: working vs waiting 구분
- `Esc to cancel` (대문자 E) → **waiting** (권한 요청)
- `esc to interrupt` (소문자 e) → **working** (작업 중단 가능)

### Gemini: 동시 출력 처리
Gemini는 한 화면에 여러 상태가 동시에 출력될 수 있음:
```
(esc to cancel, 5s)           ← working 패턴
...
▶ 1. Yes, allow once          ← waiting 패턴
```
→ priority로 해결: waiting(2) > working(1) 이므로 waiting으로 판정

### Buffer 기반 감지
- 출력이 청크로 분할되어 올 수 있음
- 2000자 버퍼로 누적하여 패턴 매칭
- idle 전환 시 버퍼 클리어

---

## 테스트 데이터 출처
- `a.txt`: Claude Code v2.0.69 세션 로그 (2024-12)
- `gemini.txt`: Gemini CLI 0.18.4 세션 로그 (2024-12)

---

## 로직 검증 결과

### TerminalStatusDetector.ts 검증

#### Claude 패턴 검증

| 실제 출력 | 기대 상태 | 매칭 패턴 | 결과 |
|-----------|----------|----------|------|
| `-- INSERT --` | idle | `/--\s*INSERT\s*--/` | ✅ |
| `-- NORMAL --` | idle | `/--\s*NORMAL\s*--/` | ✅ |
| `> ` (빈 프롬프트) | idle | `/^>\s*$/` | ⚠️ 주의 |
| `Imagining… (esc to interrupt · 0s)` | working | `/Esc to interrupt/i` | ✅ |
| `∴ Thinking…` | working | 없음 | ❌ 누락 |
| `Bash(sleep 5) Running…` | working | 없음 | ❌ 누락 |
| `Do you want to make this edit?` | waiting | `/Do you want to/i` | ✅ |
| `Esc to cancel` | waiting | `/Esc to cancel/i` | ✅ |
| `1. Yes` | waiting | `/>\s*1\.\s*Yes/i` | ✅ |

**Claude 이슈:**
1. `∴ Thinking…` 패턴 누락 - working 상태에서 출력되지만 매칭 안됨
2. `Running…` 패턴 누락 - 도구 실행 중 상태 감지 불가
3. `^>\s*$` 패턴이 멀티라인에서 제대로 동작 안할 수 있음

#### Gemini 패턴 검증

| 실제 출력 | 기대 상태 | 매칭 패턴 | 결과 |
|-----------|----------|----------|------|
| `> Type your message or @path/to/file` | idle | `/>\s*Type your message/i` | ✅ |
| `Tips for getting started:` | idle | `/Tips for getting started/i` | ✅ |
| `(esc to cancel, 0s)` | working | `/esc to cancel/i` | ✅ |
| `(esc to cancel, 5s)` | working | `/esc to cancel/i` | ✅ |
| `1. Yes, allow once` | waiting | `/1\.\s*Yes,\s*allow once/i` | ✅ |
| `Waiting for user confirmation...` | waiting | `/Waiting for user/i` | ✅ |
| `Allow execution of: 'sleep'?` | waiting | `/Allow execution/i` | ✅ |
| `suggest changes (esc)` | waiting | `/suggest changes/i` | ✅ |

**Gemini 결과:** 모든 패턴 정상 매칭 ✅

---

## 권장 수정사항

### Claude working 패턴 추가 필요

```typescript
// 현재
patterns: [
    /Esc to interrupt/i,
],

// 권장
patterns: [
    /Esc to interrupt/i,
    /∴\s*(Thinking|Imagining)/i,    // 사고 상태
    /Running…/,                      // 도구 실행 중
],
```

### Claude idle 패턴 개선

```typescript
// 현재
/^>\s*$/,  // 멀티라인에서 문제 가능

// 권장
/^>\s*$/m,  // 멀티라인 모드 추가
```

---

## 우선순위 동작 확인

동시에 여러 패턴이 매칭될 때 priority 순서대로 처리됨:

**예시: Gemini L95 출력**
```
(esc to cancel, 5s)           ← working 패턴 (priority 1)
▶ 1. Yes, allow once          ← waiting 패턴 (priority 2)
```

검증:
1. `sortedPatterns`가 priority 내림차순 정렬
2. waiting(2) 먼저 체크 → `1. Yes, allow once` 매칭
3. 결과: **waiting** ✅ (올바른 동작)
