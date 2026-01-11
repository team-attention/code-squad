import { useState, useCallback } from 'react'
import type { Selection } from '../store/appStore'

interface UseLineSelectionReturn {
  selecting: boolean
  selection: Selection | null
  handlers: {
    onMouseDown: (lineNumber: number) => void
    onMouseMove: (lineNumber: number) => void
    onMouseUp: () => void
  }
}

export function useLineSelection(
  onSelectionComplete?: (selection: Selection) => void
): UseLineSelectionReturn {
  const [selecting, setSelecting] = useState(false)
  const [anchor, setAnchor] = useState<number | null>(null)
  const [selection, setSelection] = useState<Selection | null>(null)

  const onMouseDown = useCallback((lineNumber: number) => {
    setSelecting(true)
    setAnchor(lineNumber)
    setSelection({ startLine: lineNumber, endLine: lineNumber })
  }, [])

  const onMouseMove = useCallback(
    (lineNumber: number) => {
      if (!selecting || anchor === null) return

      const startLine = Math.min(anchor, lineNumber)
      const endLine = Math.max(anchor, lineNumber)
      setSelection({ startLine, endLine })
    },
    [selecting, anchor]
  )

  const onMouseUp = useCallback(() => {
    if (selecting && selection && onSelectionComplete) {
      onSelectionComplete(selection)
    }
    setSelecting(false)
  }, [selecting, selection, onSelectionComplete])

  return {
    selecting,
    selection,
    handlers: {
      onMouseDown,
      onMouseMove,
      onMouseUp,
    },
  }
}
