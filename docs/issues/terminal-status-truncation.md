# Terminal Status Detection - Truncation 문제

## 현재 상황

Claude Code에서 파일 생성 dialog ("1. Yes", "Esc to cancel")가 표시될 때
status가 `waiting` (노란색)이 아닌 `idle` (초록색)으로 표시됨.

---

## 근본 원인: VS Code Terminal Scrollback Truncation

### 문제 발생 흐름

```
1. Claude Code가 파일 내용 출력 (수십 KB)
2. Claude Code가 dialog 표시 ("Create file?", "1. Yes", "Esc to cancel")
3. VS Code가 scrollback 설정에 따라 출력 truncate
4. Extension이 받는 데이터: [truncation 메시지] + [일부 데이터]
5. dialog 패턴이 truncate된 부분에 있으면 감지 실패
```

### 로그 증거

```
[... 41745 bytes truncated to respect terminal scrollback settings ...]
```

- 41KB가 truncate됨
- "1. Yes", "Esc to cancel" 문자열이 로그에 없음

---

## 기술적 제약

### 1. execution.read() API의 한계

- VS Code Shell Integration API 사용 중
- scrollback 설정에 따라 이미 truncate된 데이터를 받음
- truncate 전 raw 데이터에 접근 불가

### 2. onDidWriteTerminalData API 사용 불가

```typescript
// truncation 전 raw 데이터를 받을 수 있지만...
vscode.window.onDidWriteTerminalData((e) => {
    // e.data = raw terminal output
});
```

- **Proposed API** (안정화되지 않음)
- Marketplace 배포 extension에서 사용 불가
- "forever proposed" 상태

### 3. 대안 없음

| 방법 | 가능 여부 | 이유 |
|------|----------|------|
| onDidWriteTerminalData | ❌ | Proposed API |
| Terminal clipboard | ❌ | 사용자 작업 방해 |
| Custom PTY | ❌ | 복잡도, 호환성 문제 |

---

## 가능한 해결책

### 1. 유저 설정 변경 (권장)

```json
"terminal.integrated.scrollback": 10000
```

- 기본값: 1000줄
- 늘리면 truncation 발생 확률 감소
- 단점: 유저가 직접 설정해야 함

### 2. Extension에서 안내

- 첫 실행 시 scrollback 설정 권장
- truncation 발생 시 경고 표시

### 3. 문서화

- README에 권장 설정 추가
- 알려진 제한사항으로 기록

---

## 확인 필요

- [ ] scrollback 늘리면 실제로 해결되는지 테스트
- [ ] truncation 발생 빈도 파악
- [ ] 다른 AI tool (Codex, Gemini)에서도 같은 문제인지 확인

---

## 관련 코드

- `src/application/useCases/DetectThreadStatusUseCase.ts` - truncation 감지 로깅
- `src/adapters/outbound/gateways/VscodeTerminalGateway.ts` - terminal output 수신

## 참고

- [VS Code Terminal API](https://code.visualstudio.com/api/references/vscode-api#window.onDidWriteTerminalData)
- [Using Proposed API](https://code.visualstudio.com/api/advanced-topics/using-proposed-api)
