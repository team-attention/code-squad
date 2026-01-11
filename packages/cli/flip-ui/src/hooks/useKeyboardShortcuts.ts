import { useEffect } from 'react'

interface UseKeyboardShortcutsOptions {
  onFuzzyFinderToggle: () => void
  onCancel: () => void
  onSubmit: () => void
}

export function useKeyboardShortcuts({
  onFuzzyFinderToggle,
  onCancel,
  onSubmit,
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

      // Escape - Close fuzzy finder or cancel selection
      if (e.key === 'Escape') {
        // This is handled by individual components
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onFuzzyFinderToggle, onCancel, onSubmit])
}
