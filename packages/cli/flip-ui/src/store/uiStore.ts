import { create } from 'zustand'

export type DiffViewMode = 'none' | 'inline' | 'side-by-side'

interface UIState {
  // Panel visibility
  leftPanelVisible: boolean
  rightPanelVisible: boolean

  // Git filter
  showOnlyGitChanged: boolean

  // Diff view mode
  diffViewMode: DiffViewMode

  // Markdown preview
  markdownPreviewEnabled: boolean

  // Actions
  setLeftPanelVisible: (visible: boolean) => void
  setRightPanelVisible: (visible: boolean) => void
  toggleLeftPanel: () => void
  toggleRightPanel: () => void
  toggleAllPanels: () => void

  setShowOnlyGitChanged: (show: boolean) => void
  toggleGitFilter: () => void

  setDiffViewMode: (mode: DiffViewMode) => void
  cycleDiffViewMode: () => void

  setMarkdownPreviewEnabled: (enabled: boolean) => void
  toggleMarkdownPreview: () => void
}

export const useUIStore = create<UIState>((set) => ({
  // Panel visibility - default to visible
  leftPanelVisible: true,
  rightPanelVisible: true,

  // Git filter - default to showing all files
  showOnlyGitChanged: false,

  // Diff view mode - default to no diff
  diffViewMode: 'none',

  // Markdown preview - default to disabled
  markdownPreviewEnabled: false,

  // Panel actions
  setLeftPanelVisible: (visible) => set({ leftPanelVisible: visible }),
  setRightPanelVisible: (visible) => set({ rightPanelVisible: visible }),

  toggleLeftPanel: () =>
    set((state) => ({ leftPanelVisible: !state.leftPanelVisible })),

  toggleRightPanel: () =>
    set((state) => ({ rightPanelVisible: !state.rightPanelVisible })),

  toggleAllPanels: () =>
    set((state) => {
      // If any panel is visible, hide all. Otherwise, show all.
      const anyVisible = state.leftPanelVisible || state.rightPanelVisible
      return {
        leftPanelVisible: !anyVisible,
        rightPanelVisible: !anyVisible,
      }
    }),

  // Git filter actions
  setShowOnlyGitChanged: (show) => set({ showOnlyGitChanged: show }),
  toggleGitFilter: () =>
    set((state) => ({ showOnlyGitChanged: !state.showOnlyGitChanged })),

  // Diff view mode actions
  setDiffViewMode: (mode) => set({ diffViewMode: mode }),
  cycleDiffViewMode: () =>
    set((state) => {
      const modes: DiffViewMode[] = ['none', 'inline', 'side-by-side']
      const currentIndex = modes.indexOf(state.diffViewMode)
      const nextIndex = (currentIndex + 1) % modes.length
      return { diffViewMode: modes[nextIndex] }
    }),

  // Markdown preview actions
  setMarkdownPreviewEnabled: (enabled) => set({ markdownPreviewEnabled: enabled }),
  toggleMarkdownPreview: () =>
    set((state) => ({ markdownPreviewEnabled: !state.markdownPreviewEnabled })),
}))
