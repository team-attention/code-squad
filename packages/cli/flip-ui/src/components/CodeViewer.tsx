import { useMemo, useState, useRef, useEffect } from 'react'
import { FileCode, Search, Code, Eye } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { useUIStore } from '../store/uiStore'
import { useStagingStore, type StagedItem } from '../store/stagingStore'
import { useShiki, type HighlightedLine, type TokenSpan } from '../hooks/useShiki'
import { useDiff } from '../hooks/useDiff'
import { useLineSelection } from '../hooks/useLineSelection'
import MarkdownPreview from './MarkdownPreview'
import type { DiffLine } from '../api'

// Comment range info for gutter indicator
interface CommentRange {
  id: string
  startLine: number
  endLine: number
  colorIndex: number
}

interface CodeLineProps {
  lineNumber: number
  tokens: TokenSpan[]
  selected: boolean
  diffType?: 'add' | 'delete' | 'context'
  commentRanges?: CommentRange[]
  handlers: {
    onMouseDown: (lineNum: number) => void
    onMouseMove: (lineNum: number) => void
    onMouseUp: () => void
  }
}

function CodeLine({ lineNumber, tokens, selected, diffType, commentRanges = [], handlers }: CodeLineProps) {
  const diffClass =
    diffType === 'add'
      ? 'code-line-added'
      : diffType === 'delete'
      ? 'code-line-deleted'
      : ''

  // Determine gutter indicator style for each comment range
  const gutterIndicators = commentRanges.map((range) => {
    let rangeType: 'single' | 'start' | 'middle' | 'end' = 'single'
    if (range.startLine === range.endLine) {
      rangeType = 'single'
    } else if (lineNumber === range.startLine) {
      rangeType = 'start'
    } else if (lineNumber === range.endLine) {
      rangeType = 'end'
    } else {
      rangeType = 'middle'
    }
    return { ...range, rangeType }
  })

  const hasComment = gutterIndicators.length > 0

  return (
    <div
      className={`code-line ${selected ? 'code-line-selected' : ''} ${diffClass} ${hasComment ? 'has-comment' : ''}`}
      onMouseDown={() => handlers.onMouseDown(lineNumber)}
      onMouseMove={() => handlers.onMouseMove(lineNumber)}
      onMouseUp={handlers.onMouseUp}
    >
      <span className={`line-gutter ${hasComment ? 'has-comment' : ''}`}>
        {gutterIndicators.map((indicator, idx) => (
          <span
            key={indicator.id}
            className={`gutter-bar gutter-bar-${indicator.rangeType} color-${indicator.colorIndex % 6}`}
            style={{ left: `${2 + idx * 4}px` }}
          />
        ))}
      </span>
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

// Inline comment form component
interface InlineCommentFormProps {
  startLine: number
  endLine: number
  onSubmit: (comment: string) => void
  onCancel: () => void
}

function InlineCommentForm({ startLine, endLine, onSubmit, onCancel }: InlineCommentFormProps) {
  const [comment, setComment] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const handleSubmit = () => {
    if (!comment.trim()) return
    onSubmit(comment.trim())
    setComment('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    } else if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const lineDisplay = startLine === endLine ? `line ${startLine}` : `lines ${startLine}-${endLine}`

  return (
    <div className="inline-comment-form">
      <div className="inline-comment-form-header">Comment on {lineDisplay}</div>
      <textarea
        ref={textareaRef}
        className="inline-comment-textarea"
        placeholder="Leave a comment..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <div className="inline-comment-form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={!comment.trim()}
        >
          Add Comment
        </button>
      </div>
    </div>
  )
}

// Inline staged comment display
interface InlineStagedCommentProps {
  item: StagedItem
  onRemove: (id: string) => void
}

function InlineStagedComment({ item, onRemove }: InlineStagedCommentProps) {
  const lineDisplay =
    item.startLine === item.endLine
      ? `Lines ${item.startLine}`
      : `Lines ${item.startLine}-${item.endLine}`

  return (
    <div className="inline-staged-comment">
      <div className="inline-staged-comment-header">
        <span className="inline-staged-comment-location">{lineDisplay}</span>
        <button
          className="inline-staged-comment-remove"
          onClick={() => onRemove(item.id)}
          title="Remove comment"
        >
          ✕
        </button>
      </div>
      <div className="inline-staged-comment-body">{item.comment}</div>
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
  const { currentFile, selection, setSelection, clearSelection } = useAppStore()
  const { diffViewMode, markdownPreviewEnabled, toggleMarkdownPreview } = useUIStore()
  const { items: stagedItems, addItem, removeItem } = useStagingStore()

  const isMarkdownFile = currentFile?.language === 'markdown' || currentFile?.path?.endsWith('.md')

  // Get comments for current file
  const currentFileComments = useMemo(() => {
    if (!currentFile) return []
    return stagedItems
      .filter((item) => item.filePath === currentFile.path)
      .map((item, idx) => ({ ...item, colorIndex: idx }))
  }, [stagedItems, currentFile])

  // Get comments grouped by end line (for displaying inline comments)
  const commentsByEndLine = useMemo(() => {
    const map = new Map<number, StagedItem[]>()
    for (const item of currentFileComments) {
      const existing = map.get(item.endLine) || []
      existing.push(item)
      map.set(item.endLine, existing)
    }
    return map
  }, [currentFileComments])

  // Get comment ranges for each line (for gutter indicators)
  const commentRangesByLine = useMemo(() => {
    const map = new Map<number, CommentRange[]>()
    for (const item of currentFileComments) {
      for (let line = item.startLine; line <= item.endLine; line++) {
        const existing = map.get(line) || []
        existing.push({
          id: item.id,
          startLine: item.startLine,
          endLine: item.endLine,
          colorIndex: item.colorIndex,
        })
        map.set(line, existing)
      }
    }
    return map
  }, [currentFileComments])

  const handleCommentSubmit = (comment: string) => {
    if (!currentFile || !selection) return
    addItem({
      filePath: currentFile.path,
      startLine: selection.startLine,
      endLine: selection.endLine,
      comment,
    })
    clearSelection()
  }

  const handleCommentCancel = () => {
    clearSelection()
  }

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
        <FileCode size={48} className="empty-state-icon" />
        <p>Select a file to view its contents</p>
        <p className="hint">
          <Search size={12} />
          Use Cmd+P or / to search for files
        </p>
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

  // Markdown preview view
  if (isMarkdownFile && markdownPreviewEnabled) {
    return (
      <div className="code-viewer">
        <div className="code-viewer-header">
          <span className="file-path">{currentFile.path}</span>
          <div className="code-viewer-header-right">
            <span className="file-language">{currentFile.language}</span>
            <button
              className="preview-toggle-btn active"
              onClick={toggleMarkdownPreview}
              aria-label="Toggle markdown preview"
              aria-pressed="true"
            >
              <Code size={14} />
              <span>Source</span>
            </button>
          </div>
        </div>
        <div className="code-viewer-content markdown-preview-container">
          {loading ? (
            <div className="code-viewer-loading">Loading...</div>
          ) : (
            <MarkdownPreview
              content={currentFile.content}
              selection={selection}
              comments={currentFileComments}
              onSelect={(sel) => setSelection(sel)}
              onCommentSubmit={handleCommentSubmit}
              onCommentCancel={handleCommentCancel}
              onCommentRemove={removeItem}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="code-viewer">
      <div className="code-viewer-header">
        <span className="file-path">{currentFile.path}</span>
        <div className="code-viewer-header-right">
          <span className="file-language">{currentFile.language}</span>
          {isMarkdownFile && (
            <button
              className="preview-toggle-btn"
              onClick={toggleMarkdownPreview}
              aria-label="Toggle markdown preview"
              aria-pressed="false"
            >
              <Eye size={14} />
              <span>Preview</span>
            </button>
          )}
        </div>
      </div>
      <div className="code-viewer-content">
        {loading ? (
          <div className="code-viewer-loading">Loading...</div>
        ) : (
          lines.map((line) => {
            const lineComments = commentsByEndLine.get(line.lineNumber) || []
            const lineRanges = commentRangesByLine.get(line.lineNumber) || []
            const showCommentForm = selection && selection.endLine === line.lineNumber

            return (
              <div key={line.lineNumber}>
                <CodeLine
                  lineNumber={line.lineNumber}
                  tokens={line.tokens}
                  selected={isLineSelected(line.lineNumber)}
                  commentRanges={lineRanges}
                  handlers={handlers}
                />
                {/* Show existing comments for this line */}
                {lineComments.length > 0 && (
                  <div className="inline-comments-container">
                    {lineComments.map((item) => (
                      <InlineStagedComment
                        key={item.id}
                        item={item}
                        onRemove={removeItem}
                      />
                    ))}
                  </div>
                )}
                {/* Show comment form at selection end */}
                {showCommentForm && (
                  <InlineCommentForm
                    startLine={selection.startLine}
                    endLine={selection.endLine}
                    onSubmit={handleCommentSubmit}
                    onCancel={handleCommentCancel}
                  />
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default CodeViewer
