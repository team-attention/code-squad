# Empty Diff Handling

**Slug**: `vibecar-2025-01-27-empty-diff-handling`
**Created**: 2025-01-27

## Problem

Changed Files 목록에 파일이 있지만 선택 시 diff가 비어있는 경우가 발생한다.

### 케이스 1: gitignore된 파일

1. `docs/`가 `.gitignore`에 있음
2. whitelist로 트랙 → 목록에 추가
3. 파일 클릭 → git이 무시 → 빈 diff

### 케이스 2: 변경사항 원복

1. 파일 수정 → 목록에 추가
2. git checkout / undo로 원복
3. 파일 클릭 → 실제 변경 없음 → 빈 diff

## Requirements

### R1: gitignore된 파일도 diff 생성

git으로 diff를 못 얻은 경우, 파일 내용을 직접 읽어서 새 파일 diff로 표시

### R2: 진짜 빈 diff면 목록에서 제거

diff 생성 시도 후에도 비어있으면 해당 파일을 목록에서 제거

## Technical Design

### 수정 파일

| File | Change |
|------|--------|
| `VscodeGitGateway.ts` | fallback diff 로직 추가 |
| `IPanelPort.ts` | `removeFile()` 메서드 추가 |
| `GenerateDiffUseCase.ts` | 빈 diff 시 `removeFile()` 호출 |
| `SidecarPanelAdapter.ts` | `removeFile()` 구현 |
| webview script | `fileRemoved` 핸들러 추가 |

### 구현

**1. VscodeGitGateway - fallback 추가**

```typescript
// git diff 실패 시 파일 직접 읽기
private async getFallbackDiff(workspaceRoot: string, relativePath: string): Promise<string> {
  const absolutePath = path.join(workspaceRoot, relativePath);
  try {
    const content = fs.readFileSync(absolutePath, 'utf8');
    if (!content) return '';
    const lines = content.split('\n');
    return `@@ -0,0 +1,${lines.length} @@ New file\n${lines.map(l => `+${l}`).join('\n')}`;
  } catch {
    return '';
  }
}
```

**2. IPanelPort - 메서드 추가**

```typescript
removeFile(file: string): void;
```

**3. GenerateDiffUseCase - 빈 diff 처리**

```typescript
if (!diff || diff.trim() === '') {
  this.panelPort.removeFile(relativePath);
  return;
}
```

**4. Webview - 파일 제거 핸들러**

```javascript
case 'fileRemoved':
  removeFileFromList(message.file);
  break;
```

## Success Criteria

- [ ] gitignore된 새 파일 선택 시 diff 표시됨
- [ ] 변경 없는 파일 선택 시 목록에서 제거됨
- [ ] 제거 후 다른 파일 자동 선택 또는 placeholder 표시
