import { exec as execCallback } from 'child_process';
import { promisify } from 'util';

const exec = promisify(execCallback);
const execOptions = { maxBuffer: 1024 * 1024 };

/**
 * tmux 명령어 실행 래퍼
 */
export class TmuxAdapter {
    /**
     * tmux 설치 여부 확인
     */
    async isTmuxAvailable(): Promise<boolean> {
        try {
            await exec('which tmux', execOptions);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 현재 tmux 세션 내부인지 확인
     */
    isInsideTmux(): boolean {
        return !!process.env.TMUX;
    }

    /**
     * 세션 존재 여부 확인
     */
    async hasSession(name: string): Promise<boolean> {
        try {
            await exec(`tmux has-session -t "${name}"`, execOptions);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 새 tmux 세션 생성
     */
    async createSession(name: string, cwd: string): Promise<void> {
        await exec(`tmux new-session -d -s "${name}" -c "${cwd}"`, execOptions);
    }

    /**
     * 세션 생성 또는 기존 세션 반환
     * @returns true if new session created, false if existing session
     */
    async ensureSession(name: string, cwd: string): Promise<boolean> {
        if (await this.hasSession(name)) {
            return false;
        }
        await this.createSession(name, cwd);
        return true;
    }

    /**
     * 세션에 attach (spawn 사용)
     */
    async attachSession(name: string): Promise<void> {
        const { spawn } = await import('child_process');
        return new Promise((resolve, reject) => {
            const tmux = spawn('tmux', ['attach-session', '-t', name], { stdio: 'inherit' });
            tmux.on('close', (code) => {
                if (code === 0) resolve();
                else reject(new Error(`tmux attach failed with code ${code}`));
            });
            tmux.on('error', reject);
        });
    }

    /**
     * 현재 pane 분할 (수직/수평)
     * @param direction 'v' = 수직 (좌우), 'h' = 수평 (상하)
     * @param cwd 새 pane의 작업 디렉토리
     * @param percent 새 pane의 크기 비율 (옵션)
     */
    async splitWindow(direction: 'v' | 'h', cwd?: string, percent?: number): Promise<string> {
        const flag = direction === 'v' ? '-h' : '-v';  // tmux는 반대로 해석
        const cwdFlag = cwd ? `-c "${cwd}"` : '';
        const percentFlag = percent ? `-p ${percent}` : '';

        await exec(`tmux split-window ${flag} ${cwdFlag} ${percentFlag}`, execOptions);

        // 새로 생성된 pane ID 반환
        const { stdout } = await exec('tmux display-message -p "#{pane_id}"', execOptions);
        return stdout.trim();
    }

    /**
     * 특정 pane 선택 (포커스)
     */
    async selectPane(paneId: string): Promise<void> {
        await exec(`tmux select-pane -t "${paneId}"`, execOptions);
    }

    /**
     * pane 목록 조회
     */
    async listPanes(): Promise<{ id: string; index: number; active: boolean; cwd: string }[]> {
        try {
            const { stdout } = await exec(
                'tmux list-panes -F "#{pane_id}|#{pane_index}|#{pane_active}|#{pane_current_path}"',
                execOptions
            );

            return stdout.trim().split('\n').filter(Boolean).map(line => {
                const [id, index, active, cwd] = line.split('|');
                return {
                    id,
                    index: parseInt(index, 10),
                    active: active === '1',
                    cwd,
                };
            });
        } catch {
            return [];
        }
    }

    /**
     * pane 종료
     */
    async killPane(paneId: string): Promise<void> {
        await exec(`tmux kill-pane -t "${paneId}"`, execOptions);
    }

    /**
     * pane에 키 전송
     */
    async sendKeys(paneId: string, keys: string): Promise<void> {
        // 특수문자 이스케이프
        const escaped = keys.replace(/"/g, '\\"');
        await exec(`tmux send-keys -t "${paneId}" "${escaped}"`, execOptions);
    }

    /**
     * pane에 특수 키 전송 (C-l, C-c, Enter 등 tmux 키 이름)
     */
    async sendSpecialKey(paneId: string, keyName: string): Promise<void> {
        await exec(`tmux send-keys -t "${paneId}" ${keyName}`, execOptions);
    }

    /**
     * pane에 Enter 키 전송
     */
    async sendEnter(paneId: string): Promise<void> {
        await exec(`tmux send-keys -t "${paneId}" Enter`, execOptions);
    }

    /**
     * 현재 window의 레이아웃 설정
     * @param layout 'even-horizontal' | 'even-vertical' | 'main-horizontal' | 'main-vertical' | 'tiled'
     */
    async setLayout(layout: string): Promise<void> {
        await exec(`tmux select-layout ${layout}`, execOptions);
    }

    /**
     * pane 크기 조정
     */
    async resizePane(paneId: string, direction: 'U' | 'D' | 'L' | 'R', amount: number): Promise<void> {
        await exec(`tmux resize-pane -t "${paneId}" -${direction} ${amount}`, execOptions);
    }

    /**
     * pane 너비를 절대값으로 설정
     */
    async setPaneWidth(paneId: string, width: number): Promise<void> {
        await exec(`tmux resize-pane -t "${paneId}" -x ${width}`, execOptions);
    }

    /**
     * pane을 별도 window로 분리 (백그라운드 실행 유지)
     * @returns 새로 생성된 window ID
     */
    async breakPaneToWindow(paneId: string): Promise<string> {
        const { stdout } = await exec(
            `tmux break-pane -d -s "${paneId}" -P -F "#{window_id}"`,
            execOptions
        );
        return stdout.trim();
    }

    /**
     * 숨겨진 window 생성 (단일 pane)
     */
    async createHiddenWindow(cwd?: string): Promise<string> {
        const cwdFlag = cwd ? `-c "${cwd}"` : '';
        const { stdout } = await exec(
            `tmux new-window -d ${cwdFlag} -P -F "#{window_id}"`,
            execOptions
        );
        return stdout.trim();
    }

    /**
     * window의 pane을 특정 pane과 swap
     */
    async swapPaneWithWindow(windowId: string, targetPaneId: string): Promise<void> {
        await exec(`tmux swap-pane -d -s "${windowId}.0" -t "${targetPaneId}"`, execOptions);
    }

    /**
     * window 내 단일 pane 너비 설정
     */
    async setWindowPaneWidth(windowId: string, width: number): Promise<void> {
        await exec(`tmux resize-pane -t "${windowId}.0" -x ${width}`, execOptions);
    }

    /**
     * pane index로 pane ID 조회 (현재 window)
     */
    async getPaneIdByIndex(index: number): Promise<string | null> {
        try {
            const { stdout } = await exec('tmux list-panes -F "#{pane_index}|#{pane_id}"', execOptions);
            const match = stdout
                .trim()
                .split('\n')
                .map(line => line.split('|'))
                .find(([idx]) => parseInt(idx, 10) === index);
            return match?.[1] ?? null;
        } catch {
            return null;
        }
    }

    /**
     * 숨겨진 window에서 pane을 현재 window로 가져옴
     * @param windowId 숨겨진 window ID
     * @param targetPaneId 옆에 배치할 target pane
     * @returns 가져온 pane의 새 ID
     */
    async joinPaneFromWindow(windowId: string, targetPaneId: string): Promise<string> {
        // 수평 분할로 target pane 옆에 배치
        await exec(
            `tmux join-pane -h -s "${windowId}.0" -t "${targetPaneId}"`,
            execOptions
        );
        // 새로 join된 pane ID 반환
        const { stdout } = await exec('tmux display-message -p "#{pane_id}"', execOptions);
        return stdout.trim();
    }

    /**
     * pane 숨기기 (width=0) - deprecated, use breakPaneToWindow
     */
    async hidePane(paneId: string): Promise<void> {
        await exec(`tmux resize-pane -t "${paneId}" -x 0`, execOptions);
    }

    /**
     * pane 표시 (지정 너비로 복원) - deprecated, use joinPaneFromWindow
     */
    async showPane(paneId: string, width: number): Promise<void> {
        await exec(`tmux resize-pane -t "${paneId}" -x ${width}`, execOptions);
    }

    /**
     * 현재 window 너비 조회
     */
    async getWindowWidth(): Promise<number> {
        const { stdout } = await exec('tmux display-message -p "#{window_width}"', execOptions);
        return parseInt(stdout.trim(), 10);
    }

    /**
     * pane 너비 조회
     */
    async getPaneWidth(paneId: string): Promise<number> {
        const { stdout } = await exec(`tmux display-message -t "${paneId}" -p "#{pane_width}"`, execOptions);
        return parseInt(stdout.trim(), 10);
    }

    /**
     * 현재 세션 이름 조회
     */
    async getSessionName(): Promise<string | null> {
        try {
            const { stdout } = await exec('tmux display-message -p "#{session_name}"', execOptions);
            return stdout.trim();
        } catch {
            return null;
        }
    }

    /**
     * 현재 pane ID 조회
     */
    async getCurrentPaneId(): Promise<string | null> {
        try {
            const { stdout } = await exec('tmux display-message -p "#{pane_id}"', execOptions);
            return stdout.trim();
        } catch {
            return null;
        }
    }

    /**
     * UX 개선 설정 적용
     * - 마우스 모드 활성화 (클릭 선택, 드래그 리사이징)
     * - 활성 pane 테두리 강조
     * - pane swap 단축키 (Ctrl+b m)
     */
    async applyUXSettings(): Promise<void> {
        const settings = [
            'set -g mouse on',
            // extended-keys 활성화 (Shift+Tab 등 modifier key 조합 인식에 필요)
            'set -g extended-keys on',
            "set -g pane-active-border-style 'fg=cyan,bold'",
            "set -g pane-border-style 'fg=#444444'",
            'set -g pane-border-lines single',
            'set -g pane-border-status top',
            "set -g pane-border-format ' #{pane_current_path} '",
            // pane 번호 표시 시간 늘리기
            'set -g display-panes-time 5000',
            // pane 번호 색상
            "set -g display-panes-colour '#444444'",
            "set -g display-panes-active-colour cyan",
        ];

        for (const setting of settings) {
            try {
                await exec(`tmux ${setting}`, execOptions);
            } catch {
                // 일부 설정이 실패해도 계속 진행
            }
        }

        // Ctrl+b m = pane 이동 메뉴 (대시보드 pane 0 제외)
        try {
            // 간단한 메뉴 - pane 0에서는 동작 안 함, Move Left는 pane 1에서 동작 안 함
            await exec(`tmux bind-key m if-shell -F "#{!=:#{pane_index},0}" "display-menu -T 'Move Pane' -x P -y P 'Move Left' l 'if-shell -F \\"#{>:#{pane_index},1}\\" \\"swap-pane -U\\"' 'Move Right' r 'swap-pane -D' '' 'Swap #1' 1 'swap-pane -t 1' 'Swap #2' 2 'swap-pane -t 2' 'Swap #3' 3 'swap-pane -t 3' 'Swap #4' 4 'swap-pane -t 4' '' 'Cancel' q ''"`, execOptions);
        } catch {
            // 실패해도 계속 진행
        }

        // Shift+Tab = 대시보드/터미널 간 포커스 토글 (prefix 없이)
        // pane 0(대시보드)이면 pane 1(터미널)로, 그 외면 pane 0(대시보드)으로 이동
        try {
            await exec(`tmux bind-key -n BTab if-shell -F "#{==:#{pane_index},0}" "select-pane -t 1" "select-pane -t 0"`, execOptions);
        } catch {
            // 실패해도 계속 진행
        }
    }

    /**
     * 대시보드 pane 리사이즈 훅 설정
     */
    async setDashboardResizeHook(paneId: string, width: number): Promise<void> {
        try {
            await exec(`tmux set -g @csq_dash_pane "${paneId}"`, execOptions);
            await exec(`tmux set -g @csq_dash_width "${width}"`, execOptions);
            await exec(`tmux set-hook after-resize-pane 'resize-pane -t "#{@csq_dash_pane}" -x #{@csq_dash_width}'`, execOptions);
        } catch {
            // 실패해도 계속 진행
        }
    }

    /**
     * main-vertical 레이아웃 적용 (왼쪽 고정, 오른쪽 분할)
     * @param mainWidth 왼쪽 메인 pane 너비 (columns)
     */
    async applyMainVerticalLayout(mainWidth: number = 30): Promise<void> {
        try {
            await exec(`tmux set-window-option main-pane-width ${mainWidth}`, execOptions);
            await exec('tmux select-layout main-vertical', execOptions);
        } catch {
            // 실패해도 계속 진행
        }
    }

    /**
     * 특정 pane 기준으로 분할
     * @param targetPaneId 분할할 대상 pane
     * @param direction 'v' = 수직 (좌우), 'h' = 수평 (상하)
     * @param cwd 새 pane의 작업 디렉토리
     */
    async splitPane(targetPaneId: string, direction: 'v' | 'h', cwd?: string): Promise<string> {
        const flag = direction === 'v' ? '-h' : '-v';
        const cwdFlag = cwd ? `-c "${cwd}"` : '';

        await exec(`tmux split-window ${flag} -t "${targetPaneId}" ${cwdFlag}`, execOptions);

        const { stdout } = await exec('tmux display-message -p "#{pane_id}"', execOptions);
        return stdout.trim();
    }

    /**
     * 현재 세션 종료
     */
    async killCurrentSession(): Promise<void> {
        await exec('tmux kill-session', execOptions);
    }

    /**
     * 현재 클라이언트 detach (세션은 유지)
     */
    async detachClient(): Promise<void> {
        await exec('tmux detach-client', execOptions);
    }

    /**
     * 특정 window 종료
     */
    async killWindow(windowId: string): Promise<void> {
        await exec(`tmux kill-window -t "${windowId}"`, execOptions);
    }

    /**
     * pane 화면 클리어 (scrollback 포함)
     */
    async clearPane(paneId: string): Promise<void> {
        await exec(`tmux send-keys -t "${paneId}" -R`, execOptions);
        await exec(`tmux clear-history -t "${paneId}"`, execOptions);
    }

    /**
     * 클라이언트 강제 리프레시
     */
    async refreshClient(): Promise<void> {
        await exec('tmux refresh-client -S', execOptions);
    }

    /**
     * pane 위치 swap
     * @param paneId 이동할 pane
     * @param direction 'left' | 'right' | 'up' | 'down'
     */
    async swapPane(paneId: string, direction: 'left' | 'right' | 'up' | 'down'): Promise<void> {
        const dirMap: Record<string, string> = {
            left: '-U',   // swap with pane above/left
            right: '-D',  // swap with pane below/right
            up: '-U',
            down: '-D',
        };
        await exec(`tmux swap-pane -t "${paneId}" ${dirMap[direction]}`, execOptions);
    }

    /**
     * 대시보드 제외하고 오른쪽 pane들 균등 분할
     * @param dashPaneId 대시보드 pane ID
     * @param dashWidth 대시보드 너비 (columns)
     */
    async distributeRightPanes(dashPaneId: string, dashWidth: number = 35): Promise<void> {
        try {
            // 전체 window 너비 가져오기
            const { stdout: widthStr } = await exec('tmux display-message -p "#{window_width}"', execOptions);
            const totalWidth = parseInt(widthStr.trim(), 10);

            // 모든 pane 가져오기
            const panes = await this.listPanes();
            const rightPanes = panes.filter(p => p.id !== dashPaneId);

            if (rightPanes.length === 0) return;

            // 오른쪽 영역 너비 계산 (전체 - 대시보드 - 구분선)
            const rightAreaWidth = totalWidth - dashWidth - 1;
            const paneWidth = Math.floor(rightAreaWidth / rightPanes.length);

            // 각 pane 크기 조정
            for (const pane of rightPanes) {
                await exec(`tmux resize-pane -t "${pane.id}" -x ${paneWidth}`, execOptions);
            }

            // 대시보드 크기 복원
            await exec(`tmux resize-pane -t "${dashPaneId}" -x ${dashWidth}`, execOptions);
        } catch {
            // 실패해도 계속 진행
        }
    }

    // ============================================================
    // Window 관련 메서드 (Task 1, 8)
    // ============================================================

    /**
     * 현재 세션의 모든 window 목록 조회
     */
    async listWindows(): Promise<{ id: string; index: number; name: string; cwd: string; active: boolean }[]> {
        try {
            const { stdout } = await exec(
                'tmux list-windows -F "#{window_id}|#{window_index}|#{window_name}|#{pane_current_path}|#{window_active}"',
                execOptions
            );

            return stdout.trim().split('\n').filter(Boolean).map(line => {
                const [id, index, name, cwd, active] = line.split('|');
                return {
                    id,
                    index: parseInt(index, 10),
                    name,
                    cwd,
                    active: active === '1',
                };
            });
        } catch {
            return [];
        }
    }

    /**
     * 특정 window로 포커스 전환
     */
    async selectWindow(windowId: string): Promise<void> {
        await exec(`tmux select-window -t "${windowId}"`, execOptions);
    }

    /**
     * 새 window 생성
     * @param cwd 작업 디렉토리 (옵션)
     * @param name window 이름 (옵션)
     * @returns 생성된 window ID
     */
    async createNewWindow(cwd?: string, name?: string): Promise<string> {
        const cwdFlag = cwd ? `-c "${cwd}"` : '';
        const nameFlag = name ? `-n "${name}"` : '';
        const { stdout } = await exec(
            `tmux new-window -d ${cwdFlag} ${nameFlag} -P -F "#{window_id}"`,
            execOptions
        );
        return stdout.trim();
    }

    /**
     * 현재 window ID 조회
     */
    async getCurrentWindowId(): Promise<string | null> {
        try {
            const { stdout } = await exec('tmux display-message -p "#{window_id}"', execOptions);
            return stdout.trim();
        } catch {
            return null;
        }
    }

    /**
     * 현재 window index 조회
     */
    async getCurrentWindowIndex(): Promise<number | null> {
        try {
            const { stdout } = await exec('tmux display-message -p "#{window_index}"', execOptions);
            return parseInt(stdout.trim(), 10);
        } catch {
            return null;
        }
    }

    /**
     * window 이름 변경
     */
    async renameWindow(windowId: string, name: string): Promise<void> {
        await exec(`tmux rename-window -t "${windowId}" "${name}"`, execOptions);
    }
}
