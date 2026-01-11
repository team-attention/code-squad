import { useEffect, useRef, useMemo } from 'react'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'
import { useAppStore } from '../store/appStore'
import { useLineSelection } from '../hooks/useLineSelection'

function CodeViewer() {
  const { currentFile, selection, setSelection } = useAppStore()
  const codeRef = useRef<HTMLDivElement>(null)

  const { handlers } = useLineSelection((sel) => {
    setSelection(sel)
  })

  // Parse content into lines
  const lines = useMemo(() => {
    if (!currentFile) return []
    return currentFile.content.split('\n')
  }, [currentFile])

  // Highlight code
  useEffect(() => {
    if (!codeRef.current || !currentFile) return

    const codeElements = codeRef.current.querySelectorAll('code')
    codeElements.forEach((el) => {
      hljs.highlightElement(el as HTMLElement)
    })
  }, [currentFile, lines])

  if (!currentFile) {
    return (
      <div className="code-viewer code-viewer-empty">
        <p>Select a file to view its contents</p>
        <p className="hint">Use Cmd+P or / to search for files</p>
      </div>
    )
  }

  const isLineSelected = (lineNum: number) => {
    if (!selection) return false
    return lineNum >= selection.startLine && lineNum <= selection.endLine
  }

  return (
    <div className="code-viewer">
      <div className="code-viewer-header">
        <span className="file-path">{currentFile.path}</span>
        <span className="file-language">{currentFile.language}</span>
      </div>
      <div
        className="code-viewer-content"
        ref={codeRef}
        onMouseLeave={() => {
          // Cancel selection if mouse leaves
        }}
      >
        {lines.map((line, idx) => {
          const lineNum = idx + 1
          const selected = isLineSelected(lineNum)

          return (
            <div
              key={lineNum}
              className={`code-line ${selected ? 'code-line-selected' : ''}`}
              onMouseDown={() => handlers.onMouseDown(lineNum)}
              onMouseMove={() => handlers.onMouseMove(lineNum)}
              onMouseUp={handlers.onMouseUp}
            >
              <span className="line-number">{lineNum}</span>
              <code className={`language-${currentFile.language}`}>
                {line || ' '}
              </code>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CodeViewer
