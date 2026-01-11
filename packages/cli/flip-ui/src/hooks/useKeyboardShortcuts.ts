import { useEffect } from 'react'

interface UseKeyboardShortcutsOptions {
  onFuzzyFinderToggle: () => void
  onCancel: () => void
  onSubmit: () => void
  onToggleLeftPanel: () => void
  onToggleRightPanel: () => void
  onToggleAllPanels: () => void
  onToggleGitFilter: () => void
  onCycleDiffMode: () => void
}

export function useKeyboardShortcuts({
  onFuzzyFinderToggle,
  onCancel,
  onSubmit,
  onToggleLeftPanel,
  onToggleRightPanel,
  onToggleAllPanels,
  onToggleGitFilter,
  onCycleDiffMode,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable

      // Cmd+P or / (when not in input) - Fuzzy Finder
      if ((e.metaKey && e.key === 'p') || (!isInput && e.key === '/')) {
        e.preventDefault()
        onFuzzyFinderToggle()
        return
      }

      // q (when not in input) - Cancel
      if (!isInput && e.key === 'q') {
        e.preventDefault()
        onCancel()
        return
      }

      // Cmd+Enter - Submit
      if (e.metaKey && e.key === 'Enter') {
        e.preventDefault()
        onSubmit()
        return
      }

      // Cmd+B - Toggle left panel (file tree)
      if (e.metaKey && !e.shiftKey && e.key === 'b') {
        e.preventDefault()
        onToggleLeftPanel()
        return
      }

      // Cmd+Shift+B - Toggle right panel (staging)
      if (e.metaKey && e.shiftKey && e.key === 'B') {
        e.preventDefault()
        onToggleRightPanel()
        return
      }

      // Cmd+\ - Toggle all panels (zen mode)
      if (e.metaKey && e.key === '\\') {
        e.preventDefault()
        onToggleAllPanels()
        return
      }

      // Cmd+G - Toggle git filter
      if (e.metaKey && e.key === 'g') {
        e.preventDefault()
        onToggleGitFilter()
        return
      }

      // Cmd+D - Cycle diff mode
      if (e.metaKey && e.key === 'd') {
        e.preventDefault()
        onCycleDiffMode()
        return
      }

      // Escape - Close fuzzy finder or cancel selection
      if (e.key === 'Escape') {
        // This is handled by individual components
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    onFuzzyFinderToggle,
    onCancel,
    onSubmit,
    onToggleLeftPanel,
    onToggleRightPanel,
    onToggleAllPanels,
    onToggleGitFilter,
    onCycleDiffMode,
  ])
}
