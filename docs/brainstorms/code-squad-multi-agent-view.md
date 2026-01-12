# Brainstorm: Code Squad Multi-Agent View

## Initial Problem Statement

Cursor의 Agents View 같은 것을 만들고 싶다:
- 왼쪽 Activity Panel: 스레드 생성 폼 + 실행 중인 스레드 리스트
- 메인 패널: 터미널(에이전트 실행) + Sidecar 패널(파일 변경 리뷰)
- 스레드별 독립된 터미널-사이드카 조합
- 스레드 전환 시 해당 스레드의 패널들로 전환
- 최종적으로 Sidecar 레포를 "Code Squad"로 리브랜딩

## Discovery Journey

### Q1-3: 현재 상황 이해

code-squad 레포 분석 결과:
- 이미 멀티 에이전트 스레드 관리 구조 구현됨
- 사이드바: 스레드 리스트 + 생성 폼
- 에디터 영역: 각 스레드별 터미널
- Git worktree 지원으로 격리된 개발 환경 제공

### Q4: Sidecar의 역할

- 터미널의 디렉토리/브랜치 기준으로 git diff, whitelisted file changes 표시
- 코멘트 기능
- 여러 스레드를 스폰하니까 각 스레드별로 보여주고 싶음
- 리소스 걱정: 격리시키고 싶지만 메모리 관리가 걱정

### Q5: 실제 워크플로우

- Thread 1: 클라이언트 개발
- Thread 2: 백엔드 개발
- 병렬로 작업 시키고 사용자는 리뷰

### Q6: 근본적 문제

**"AI 에이전트 여러 개를 동시에 돌리면서 각각의 진행상황을 편하게 모니터링하고 싶다"**

### Q7-9: 세부 요구사항

- 동시 스레드 수: 3-5개 (최대 5개)
- 모니터링: 기존 Sidecar 기능으로 충분
- 스레드 전환: 데이터만 로드해도 괜찮음 (웹뷰 공유 가능)
- Whitelist 관리: 스레드별로 독립적으로 관리 필요

### Cursor Agents View 조사

**Cursor 2.0 핵심 메커니즘:**

| 기능 | 구현 방식 |
|------|----------|
| 격리 | Git Worktree 자동 생성 (1 agent = 1 worktree) |
| 병렬 실행 | 최대 8개, 각각 독립된 codebase 복사본 |
| 파일 뷰어 | 카드 기반 - 클릭하면 해당 agent의 변경사항 표시 |
| 전환 | 사이드바에서 클릭 → 해당 agent의 컨텍스트로 전환 |
| 병합 | Apply 버튼 → 메인 브랜치에 merge |

**Cursor vs Code Squad 차이점:**

| | Cursor | Code Squad |
|--|--------|------------|
| 에이전트 | Cursor 내장 AI | Claude Code, Codex, Gemini 등 CLI |
| 실행 방식 | Cursor가 직접 코드 수정 | 터미널에서 CLI 에이전트 실행 |
| 파일 뷰어 | 내장 diff 뷰어 | Sidecar (diff + whitelist + 코멘트) |
| 격리 | Git Worktree 자동 | 선택적 (branch/worktree) |

## Root Problem

**"AI 코딩 에이전트(CLI 기반)를 여러 개 병렬로 돌리면서, Cursor처럼 각 에이전트의 진행상황과 변경사항을 한 곳에서 모니터링하고 리뷰하고 싶다"**

Cursor와 다른 점:
1. 에이전트가 터미널 기반 → 터미널 UI 필요
2. Sidecar로 리뷰 → 기존 Sidecar 기능 재활용
3. 3-5개 정도 → 리소스 관리 가능한 범위

## Solution Space

### Target UI

```
┌──────────────────────────────────────────────────────────────────┐
│                    Code Squad                                     │
├────────────┬─────────────────────────────────────────────────────┤
│  Activity  │              Editor Area                             │
│  Sidebar   │                                                      │
│            │  ┌────────────────────┬────────────────────────────┐│
│ [입력폼]   │  │    Terminal        │     Sidecar Panel          ││
│ Name: ___  │  │                    │                            ││
│ ○Branch    │  │  $ claude          │  📁 Changed Files          ││
│ ○Worktree  │  │  > Working on...   │  ├─ src/api.ts (+15)      ││
│ [Create]   │  │  > Created file... │  └─ src/utils.ts (+8)     ││
│            │  │                    │                            ││
│ ─────────  │  │                    │  💬 Comments               ││
│ Threads:   │  │                    │  └─ "이 부분 확인 필요"    ││
│ ▶ Thread1  │  │                    │                            ││
│   Thread2  │  │                    │  [Whitelist 관리]          ││
│   Thread3  │  └────────────────────┴────────────────────────────┘│
│            │   * 스레드 클릭 → 해당 터미널+사이드카 상태로 전환    │
└────────────┴─────────────────────────────────────────────────────┘
```

### Approach 1: Sidecar 확장 (Sidecar에 code-squad 기능 흡수)

**개념**: 기존 Sidecar 레포에 code-squad의 멀티스레드 기능을 통합

**장점**:
- 기존 Sidecar 인프라 활용 (webview, git 연동 등)
- 하나의 확장으로 모든 기능 제공
- 이미 익숙한 코드베이스

**단점**:
- Sidecar 아키텍처 대규모 변경 필요
- 복잡도 증가

**구현 방향**:
- ThreadManager 추가 (code-squad에서 가져옴)
- Sidecar 상태를 스레드별로 관리
- 터미널 관리 기능 추가

### Approach 2: code-squad 확장 (code-squad에 Sidecar 기능 흡수)

**개념**: code-squad 레포를 기반으로 Sidecar의 리뷰 기능 통합

**장점**:
- 이미 멀티스레드 구조가 있음
- 터미널 관리가 구현되어 있음
- 깔끔한 새 시작

**단점**:
- Sidecar의 webview, 코멘트 기능 재구현 필요
- 기존 Sidecar 사용자 마이그레이션

**구현 방향**:
- Sidecar webview 포팅
- 스레드별 상태 관리 추가
- 기존 Sidecar 기능 (diff, whitelist, comments) 통합

### Approach 3: 하이브리드 (공유 Sidecar + 스레드별 상태)

**개념**: Sidecar 웹뷰는 하나만 유지, 상태만 스레드별로 관리

**장점**:
- 메모리 효율적 (웹뷰 1개)
- 기존 Sidecar 코드 최대한 재활용
- 점진적 마이그레이션 가능

**단점**:
- 스레드 전환 시 약간의 로딩 시간
- 상태 동기화 복잡도

**구현 방향**:
```typescript
interface ThreadSidecarState {
  threadId: string;
  workingDir: string;
  branch: string;
  whitelistedFiles: string[];
  comments: Comment[];
  diffCache: DiffData;
}

class SidecarStateManager {
  private states: Map<string, ThreadSidecarState>;
  private activeThreadId: string | null;

  switchToThread(threadId: string) {
    // 현재 상태 저장 → 새 상태 로드 → 웹뷰 업데이트
  }
}
```

## Recommendations

### 추천: Approach 1 (Sidecar 확장)

**이유**:
1. **기존 투자 활용**: Sidecar의 webview, git 연동, 코멘트 시스템 재활용
2. **아키텍처 정합성**: Sidecar의 Clean Architecture에 맞춰 확장 가능
3. **리브랜딩 용이**: "Sidecar" → "Code Squad"로 자연스러운 전환
4. **점진적 개발**: 기존 기능 유지하면서 스레드 기능 추가

### 구현 순서 제안

1. **Phase 1**: 스레드 관리 기초
   - ThreadManager 도입
   - 사이드바에 스레드 리스트 UI 추가
   - 스레드 생성/삭제 기능

2. **Phase 2**: 터미널 연동
   - 스레드별 터미널 생성
   - 에이전트 타입 선택 (claude, codex, gemini)
   - 터미널 ↔ 스레드 연결

3. **Phase 3**: Sidecar 상태 분리
   - 스레드별 상태 저장 구조
   - 스레드 전환 시 상태 스위칭
   - Whitelist/코멘트 스레드별 관리

4. **Phase 4**: UX 개선
   - 스레드 상태 표시 (running, waiting, error)
   - 빠른 전환 단축키
   - 리브랜딩 (Code Squad)

## Rebranding: Sidecar → Code Squad

### 제약 조건

- **기존 레포 유지**: 이미 GitHub 스타가 있어서 레포 자체는 유지
- **레포 이름 변경**: `sidecar` → `code-squad` (GitHub에서 rename)
- **기존 사용자 고려**: 마켓플레이스 extension ID 변경 시 기존 설치 영향

### 리브랜딩 체크리스트

**GitHub 레포**:
- [ ] 레포 이름 변경 (GitHub이 자동 리다이렉트 제공)
- [ ] Description 업데이트
- [ ] README 전면 개편
- [ ] Topics/Tags 업데이트

**VS Code Extension**:
- [ ] `package.json` - name, displayName, description 변경
- [ ] Extension ID 변경 (`eatnug.sidecar` → `eatnug.code-squad`)
- [ ] 아이콘 변경
- [ ] 마켓플레이스 페이지 업데이트

**코드 내부**:
- [ ] 폴더/파일명에서 "sidecar" 참조 업데이트
- [ ] 클래스/변수명 정리 (선택적)
- [ ] 문서 업데이트

### 리브랜딩 타이밍

**옵션 A: 기능 완성 후 리브랜딩**
- 멀티스레드 기능이 완성된 후 한 번에 리브랜딩
- 장점: 새 이름에 맞는 완전한 기능셋
- 단점: 중간에 혼란 (Sidecar인데 스레드 기능?)

**옵션 B: 먼저 리브랜딩 → 기능 추가**
- 이름부터 바꾸고 점진적 기능 추가
- 장점: 명확한 방향성
- 단점: 처음엔 이름과 기능 불일치

**추천: 옵션 A** - Phase 4에서 리브랜딩과 함께 정식 출시

## Next Step

```
/spec code-squad-multi-agent-view
```
