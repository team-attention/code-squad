# csq 설치 및 iTerm 핫키 설정 가이드

## 설치 방법

### 방법 1: npm (권장)

```bash
npm install -g code-squad-cli
```

설치 후 바로 사용:
```bash
csq flip
```

### 방법 2: npx (설치 없이)

```bash
npx code-squad-cli flip
```

### 방법 3: Homebrew (macOS)

```bash
# tap 추가 (최초 1회)
brew tap team-attention/tap

# 설치
brew install csq
```

> **Note**: brew 설치는 npm publish 후 formula 업데이트 필요

---

## iTerm2 핫키 설정

flip을 단축키로 바로 실행하려면 iTerm2에 핫키를 등록합니다.

### 설정 방법

1. **iTerm2** > **Settings** (⌘,) > **Keys** > **Key Bindings**

2. **+** 버튼 클릭하여 새 바인딩 추가

3. 설정:
   - **Keyboard Shortcut**: 원하는 키 조합 (예: `⌘⇧F`)
   - **Action**: `Send Text with "vim" Special Chars`
   - **Text**:
     ```
     csq flip\n
     ```

4. **OK** 클릭

### 권장 단축키

| 단축키 | 설명 |
|--------|------|
| `⌘⇧F` | Cmd+Shift+F - "Flip" 연상 |
| `⌘⇧C` | Cmd+Shift+C - "Comment" 연상 |
| `⌥F` | Option+F - 간단한 조합 |

### 세션 ID 자동 전달 (고급)

멀티 패널에서 정확한 세션에 붙여넣기하려면 세션 ID를 함께 전달합니다.

1. iTerm2 > Settings > Profiles > (프로필 선택) > Advanced

2. **Triggers** 섹션에서 shell integration 활성화

3. Key Binding에서 Text를 다음으로 변경:
   ```
   ITERM_SESSION_ID=$(osascript -e 'tell application "iTerm2" to id of current session of current window') && echo $ITERM_SESSION_ID > /tmp/flip-view-session-$(uuidgen) && csq flip --session $(ls -t /tmp/flip-view-session-* | head -1 | xargs basename | sed 's/flip-view-session-//')\n
   ```

   또는 간단하게 shell function 사용 (아래 참조)

---

## Shell Function 설정 (권장)

`.zshrc` 또는 `.bashrc`에 추가:

```bash
# csq flip with session tracking
flip() {
    local session_id=$(uuidgen)
    local iterm_session=$(osascript -e 'tell application "iTerm2" to id of current session of current window' 2>/dev/null)

    if [ -n "$iterm_session" ]; then
        echo "$iterm_session" > "/tmp/flip-view-session-$session_id"
    fi

    csq flip --session "$session_id" "$@"
}
```

이후 터미널에서:
```bash
flip              # 현재 디렉토리
flip /path/to    # 특정 디렉토리
```

iTerm 핫키에서는:
```
flip\n
```

---

## 사용 예시

### 기본 사용 (oneshot)

```bash
# AI 세션 실행 중인 터미널에서
csq flip

# 브라우저에서:
# 1. 파일 선택
# 2. 라인 드래그 선택
# 3. 코멘트 입력
# 4. Submit (⌘Enter)
# → 자동으로 터미널에 붙여넣기됨
```

### 서버 모드 (반복 사용)

```bash
# 터미널 1: 서버 실행
csq flip serve

# 터미널 2: AI 작업 중
# 핫키로 브라우저만 열기
csq flip open
```

### 멀티 패널

```
┌─────────────────┬─────────────────┐
│ Claude Code     │ Codex           │
│ (panel 1)       │ (panel 2)       │
├─────────────────┼─────────────────┤
│ flip 실행 →     │                 │
│ submit하면      │                 │
│ 여기로 붙여넣기 │                 │
└─────────────────┴─────────────────┘
```

각 패널에서 `flip` 실행 시 해당 패널로만 결과가 전송됩니다.

---

## 트러블슈팅

### "command not found: csq"

```bash
# npm 전역 설치 경로 확인
npm root -g

# PATH에 추가 (.zshrc)
export PATH="$PATH:$(npm root -g)/../bin"
```

### iTerm AppleScript 권한 오류

System Preferences > Privacy & Security > Automation에서 iTerm2 허용

### 브라우저가 안 열림

```bash
# open 명령 테스트
open http://localhost:51234

# 수동으로 열기
csq flip serve  # 서버만 실행
# 브라우저에서 http://localhost:51234 접속
```
