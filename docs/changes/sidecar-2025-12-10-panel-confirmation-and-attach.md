# Panel Confirmation and Attach to Terminal

## Summary

AI CLI 감지 시 패널 열기 전 확인 팝업 추가 및 기존 터미널에 수동 attach 기능 구현.

## Changes

### New Features

1. **Panel Open Confirmation Popup**
   - AI CLI (Claude/Codex/Gemini) 감지 시 QuickPick으로 패널 열기 확인
   - Options: Yes / No / Always / Never
   - 설정은 workspaceState에 저장 (`sidecar.autoOpenPanel`)
   - Reset command: `Sidecar: Reset Auto-Open Setting`

2. **Attach to Terminal Command**
   - `Sidecar: Attach to Terminal` 커맨드 추가
   - 패널 닫은 후 기존 터미널에 다시 연결 가능
   - 터미널이 하나뿐이면 자동 attach
   - Orphaned session 자동 정리

3. **Waiting Screen Improvements**
   - "Waiting for changes..." 텍스트 제거
   - Progress spinner 제거
   - "Meanwhile" divider 제거
   - Layout guide에 `Terminal: Create New Terminal in Editor Area` 명령어 안내 추가

### Bug Fixes

1. **Panel dispose 시 session 정리 버그 수정**
   - `clearRenderCallback()`을 `reset()` 전에 호출하도록 순서 변경
   - `sessions.delete()`를 먼저 실행하여 에러 발생해도 세션 삭제되도록 수정

2. **Prior Changes 토글 시 layout guide 사라지는 버그 수정**
   - `selectedFile`이 없으면 waiting screen 표시하도록 조건 수정

### Removed

- `sidecar.showPanel` 커맨드 제거 (attachToTerminal로 대체)
- `sidecar.focusPanel` 커맨드 제거

## Files Changed

### New Files
- `src/application/ports/outbound/IWorkspaceStatePort.ts` - WorkspaceState port interface
- `src/adapters/outbound/gateways/VscodeWorkspaceStateGateway.ts` - VSCode workspaceState gateway

### Modified Files
- `src/adapters/inbound/controllers/AIDetectionController.ts` - Confirmation popup, attach logic
- `src/adapters/inbound/ui/SidecarPanelAdapter.ts` - Dispose logging
- `src/adapters/inbound/ui/webview/components/waiting/WaitingScreen.ts` - UI simplification
- `src/adapters/inbound/ui/webview/core/App.ts` - Waiting screen condition fix
- `src/adapters/inbound/ui/webview/components/sidebar/FileList.ts` - Remove waiting text
- `src/adapters/inbound/ui/webview/html.ts` - Remove waiting text
- `src/domain/entities/AISession.ts` - Add `getDisplayName()` static method
- `src/extension.ts` - Wire new gateway, register commands
- `package.json` - Update commands
