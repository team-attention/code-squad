import { useMemo } from 'react'
import { useAppStore } from '../store/appStore'
import { useUIStore } from '../store/uiStore'
import { useShiki, type HighlightedLine, type TokenSpan } from '../hooks/useShiki'
import { useDiff } from '../hooks/useDiff'
import { useLineSelection } from '../hooks/useLineSelection'
import type { DiffLine } from '../api'

interface CodeLineProps {
  lineNumber: number
  tokens: TokenSpan[]
  selected: boolean
  diffType?: 'add' | 'delete' | 'context'
  handlers: {
    onMouseDown: (lineNum: number) => void
    onMouseMove: (lineNum: number) => void
    onMouseUp: () => void
  }
}

function CodeLine({ lineNumber, tokens, selected, diffType, handlers }: CodeLineProps) {
  const diffClass =
    diffType === 'add'
      ? 'code-line-added'
      : diffType === 'delete'
      ? 'code-line-deleted'
      : ''

  return (
    <div
      className={`code-line ${selected ? 'code-line-selected' : ''} ${diffClass}`}
      onMouseDown={() => handlers.onMouseDown(lineNumber)}
      onMouseMove={() => handlers.onMouseMove(lineNumber)}
      onMouseUp={handlers.onMouseUp}
    >
      <span className="line-number">{lineNumber}</span>
      <span className="code-content">
        {tokens.map((token, idx) => (
          <span
            key={idx}
            style={{
              color: token.color,
              fontStyle: token.fontStyle === 'italic' ? 'italic' : undefined,
              fontWeight: token.fontStyle === 'bold' ? 'bold' : undefined,
            }}
          >
            {token.content}
          </span>
        ))}
      </span>
    </div>
  )
}

// Inline diff view - shows added/deleted lines with highlighting
function InlineDiffView({
  lines,
  diffLines,
  selection,
  handlers,
}: {
  lines: HighlightedLine[]
  diffLines: Map<number, 'add' | 'delete' | 'context'>
  selection: { startLine: number; endLine: number } | null
  handlers: {
    onMouseDown: (lineNum: number) => void
    onMouseMove: (lineNum: number) => void
    onMouseUp: () => void
  }
}) {
  const isLineSelected = (lineNum: number) => {
    if (!selection) return false
    return lineNum >= selection.startLine && lineNum <= selection.endLine
  }

  return (
    <>
      {lines.map((line) => (
        <CodeLine
          key={line.lineNumber}
          lineNumber={line.lineNumber}
          tokens={line.tokens}
          selected={isLineSelected(line.lineNumber)}
          diffType={diffLines.get(line.lineNumber)}
          handlers={handlers}
        />
      ))}
    </>
  )
}

// Side-by-side diff view
function SideBySideDiffView({
  originalLines,
  modifiedLines,
  diffData,
}: {
  originalLines: HighlightedLine[]
  modifiedLines: HighlightedLine[]
  diffData: DiffLine[]
}) {
  // Build paired lines for side-by-side view
  const pairedLines = useMemo(() => {
    const pairs: Array<{
      left: { lineNumber: number; tokens: TokenSpan[]; type: 'context' | 'delete' } | null
      right: { lineNumber: number; tokens: TokenSpan[]; type: 'context' | 'add' } | null
    }> = []

    // Create a map of line numbers to highlighted tokens
    const originalMap = new Map(originalLines.map((l) => [l.lineNumber, l.tokens]))
    const modifiedMap = new Map(modifiedLines.map((l) => [l.lineNumber, l.tokens]))

    for (const line of diffData) {
      if (line.type === 'context') {
        pairs.push({
          left: {
            lineNumber: line.oldLineNumber!,
            tokens: originalMap.get(line.oldLineNumber!) || [{ content: line.content, color: '#e6edf3' }],
            type: 'context',
          },
          right: {
            lineNumber: line.newLineNumber!,
            tokens: modifiedMap.get(line.newLineNumber!) || [{ content: line.content, color: '#e6edf3' }],
            type: 'context',
          },
        })
      } else if (line.type === 'delete') {
        pairs.push({
          left: {
            lineNumber: line.oldLineNumber!,
            tokens: originalMap.get(line.oldLineNumber!) || [{ content: line.content, color: '#e6edf3' }],
            type: 'delete',
          },
          right: null,
        })
      } else if (line.type === 'add') {
        pairs.push({
          left: null,
          right: {
            lineNumber: line.newLineNumber!,
            tokens: modifiedMap.get(line.newLineNumber!) || [{ content: line.content, color: '#e6edf3' }],
            type: 'add',
          },
        })
      }
    }

    return pairs
  }, [originalLines, modifiedLines, diffData])

  if (pairedLines.length === 0) {
    return (
      <div className="code-viewer-empty">
        <p>No changes in this file</p>
      </div>
    )
  }

  return (
    <div className="diff-side-by-side">
      <div className="diff-pane diff-pane-left">
        <div className="diff-pane-header">Original</div>
        <div className="code-viewer-content">
          {pairedLines.map((pair, idx) => (
            <div
              key={idx}
              className={`code-line ${pair.left?.type === 'delete' ? 'code-line-deleted' : ''}`}
            >
              <span className="line-number">{pair.left?.lineNumber || ''}</span>
              <span className="code-content">
                {pair.left?.tokens.map((token, tidx) => (
                  <span key={tidx} style={{ color: token.color }}>
                    {token.content}
                  </span>
                )) || ' '}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="diff-pane diff-pane-right">
        <div className="diff-pane-header">Modified</div>
        <div className="code-viewer-content">
          {pairedLines.map((pair, idx) => (
            <div
              key={idx}
              className={`code-line ${pair.right?.type === 'add' ? 'code-line-added' : ''}`}
            >
              <span className="line-number">{pair.right?.lineNumber || ''}</span>
              <span className="code-content">
                {pair.right?.tokens.map((token, tidx) => (
                  <span key={tidx} style={{ color: token.color }}>
                    {token.content}
                  </span>
                )) || ' '}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CodeViewer() {
  const { currentFile, selection, setSelection } = useAppStore()
  const { diffViewMode } = useUIStore()

  const { handlers } = useLineSelection((sel) => {
    setSelection(sel)
  })

  const { lines, loading: shikiLoading } = useShiki({
    code: currentFile?.content || '',
    language: currentFile?.language || 'text',
  })

  const { diff, loading: diffLoading } = useDiff({
    filePath: currentFile?.path || null,
    enabled: diffViewMode !== 'none',
  })

  // Build map of line numbers to diff types for inline view
  const diffLines = useMemo(() => {
    const map = new Map<number, 'add' | 'delete' | 'context'>()
    if (!diff || diff.hunks.length === 0) return map

    for (const hunk of diff.hunks) {
      for (const line of hunk.lines) {
        if (line.type === 'add' && line.newLineNumber) {
          map.set(line.newLineNumber, 'add')
        } else if (line.type === 'delete' && line.oldLineNumber) {
          // For inline view, we show deletions at their original position
          // This is approximate - proper inline diff would need more complex handling
        }
      }
    }

    return map
  }, [diff])

  // Collect all diff lines for side-by-side view
  const allDiffLines = useMemo(() => {
    if (!diff || diff.hunks.length === 0) return []
    return diff.hunks.flatMap((h) => h.lines)
  }, [diff])

  if (!currentFile) {
    return (
      <div className="code-viewer code-viewer-empty">
        <p>Select a file to view its contents</p>
        <p className="hint">Use Cmd+P or / to search for files</p>
      </div>
    )
  }

  const loading = shikiLoading || diffLoading

  // Side-by-side diff view
  if (diffViewMode === 'side-by-side') {
    return (
      <div className="code-viewer">
        <div className="code-viewer-header">
          <span className="file-path">{currentFile.path}</span>
          <span className="file-language">Side by Side - {currentFile.language}</span>
        </div>
        {loading ? (
          <div className="code-viewer-loading">Loading...</div>
        ) : allDiffLines.length > 0 ? (
          <SideBySideDiffView
            originalLines={lines}
            modifiedLines={lines}
            diffData={allDiffLines}
          />
        ) : (
          <div className="code-viewer-content">
            {lines.map((line) => (
              <CodeLine
                key={line.lineNumber}
                lineNumber={line.lineNumber}
                tokens={line.tokens}
                selected={false}
                handlers={handlers}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  // Inline diff view
  if (diffViewMode === 'inline') {
    return (
      <div className="code-viewer">
        <div className="code-viewer-header">
          <span className="file-path">{currentFile.path}</span>
          <span className="file-language">Inline Diff - {currentFile.language}</span>
        </div>
        <div className="code-viewer-content">
          {loading ? (
            <div className="code-viewer-loading">Loading...</div>
          ) : (
            <InlineDiffView
              lines={lines}
              diffLines={diffLines}
              selection={selection}
              handlers={handlers}
            />
          )}
        </div>
      </div>
    )
  }

  // Normal view
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
      <div className="code-viewer-content">
        {loading ? (
          <div className="code-viewer-loading">Loading...</div>
        ) : (
          lines.map((line) => (
            <CodeLine
              key={line.lineNumber}
              lineNumber={line.lineNumber}
              tokens={line.tokens}
              selected={isLineSelected(line.lineNumber)}
              handlers={handlers}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default CodeViewer
