import { useState, useCallback, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useShiki } from '../hooks/useShiki'
import InlineCommentForm from './InlineCommentForm'
import InlineStagedComment from './InlineStagedComment'
import type { StagedItem } from '../store/stagingStore'

// Comment range for gutter indicators
interface CommentRange {
  id: string
  startLine: number
  endLine: number
  colorIndex: number
}

interface MarkdownPreviewProps {
  content: string
  selection: { startLine: number; endLine: number } | null
  comments: Array<StagedItem & { colorIndex: number }>
  onSelect: (selection: { startLine: number; endLine: number }) => void
  onCommentSubmit: (comment: string) => void
  onCommentCancel: () => void
  onCommentRemove: (id: string) => void
}

interface CodeBlockProps {
  className?: string
  children?: React.ReactNode
}

function CodeBlock({ className, children }: CodeBlockProps) {
  const match = /language-(\w+)/.exec(className || '')
  const language = match ? match[1] : 'text'
  const code = String(children).replace(/\n$/, '')

  const { lines } = useShiki({
    code,
    language,
  })

  if (!match) {
    return <code className="inline-code">{children}</code>
  }

  return (
    <div className="markdown-code-block">
      <div className="markdown-code-header">
        <span className="markdown-code-language">{language}</span>
      </div>
      <pre className="markdown-code-content">
        {lines.map((line) => (
          <div key={line.lineNumber} className="markdown-code-line">
            {line.tokens.map((token, idx) => (
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
          </div>
        ))}
      </pre>
    </div>
  )
}

// Parse markdown into blocks with line numbers
interface ContentBlock {
  type: 'text' | 'code' | 'heading' | 'list' | 'blockquote' | 'table' | 'hr'
  content: string
  startLine: number
  endLine: number
}

function parseMarkdownBlocks(content: string): ContentBlock[] {
  const lines = content.split('\n')
  const blocks: ContentBlock[] = []

  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    // Empty lines
    if (trimmed === '') {
      i++
      continue
    }

    // Code block
    if (trimmed.startsWith('```')) {
      const startLine = i + 1
      const codeLines = [line]
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      if (i < lines.length) {
        codeLines.push(lines[i])
        i++
      }
      blocks.push({
        type: 'code',
        content: codeLines.join('\n'),
        startLine,
        endLine: i,
      })
      continue
    }

    // Heading
    if (/^#{1,6}\s/.test(trimmed)) {
      blocks.push({
        type: 'heading',
        content: line,
        startLine: i + 1,
        endLine: i + 1,
      })
      i++
      continue
    }

    // HR
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({
        type: 'hr',
        content: line,
        startLine: i + 1,
        endLine: i + 1,
      })
      i++
      continue
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      const startLine = i + 1
      const quoteLines = [line]
      i++
      while (i < lines.length && (lines[i].trim().startsWith('>') || (lines[i].trim() !== '' && quoteLines.length > 0))) {
        if (lines[i].trim() === '' && !lines[i + 1]?.trim().startsWith('>')) break
        quoteLines.push(lines[i])
        i++
      }
      blocks.push({
        type: 'blockquote',
        content: quoteLines.join('\n'),
        startLine,
        endLine: i,
      })
      continue
    }

    // List
    if (/^(\s*[-*+]|\s*\d+\.)\s/.test(line)) {
      const startLine = i + 1
      const listLines = [line]
      i++
      while (i < lines.length) {
        const nextLine = lines[i]
        const nextTrimmed = nextLine.trim()
        if (nextTrimmed === '') {
          // Allow one empty line in lists
          if (i + 1 < lines.length && /^(\s*[-*+]|\s*\d+\.)\s/.test(lines[i + 1])) {
            listLines.push(nextLine)
            i++
            continue
          }
          break
        }
        if (/^(\s*[-*+]|\s*\d+\.)\s/.test(nextLine) || /^\s+/.test(nextLine)) {
          listLines.push(nextLine)
          i++
        } else {
          break
        }
      }
      blocks.push({
        type: 'list',
        content: listLines.join('\n'),
        startLine,
        endLine: i,
      })
      continue
    }

    // Table
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const startLine = i + 1
      const tableLines = [line]
      i++
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i])
        i++
      }
      blocks.push({
        type: 'table',
        content: tableLines.join('\n'),
        startLine,
        endLine: i,
      })
      continue
    }

    // Regular text paragraph
    const startLine = i + 1
    const textLines = [line]
    i++
    while (i < lines.length) {
      const nextTrimmed = lines[i].trim()
      if (nextTrimmed === '' ||
          nextTrimmed.startsWith('#') ||
          nextTrimmed.startsWith('```') ||
          nextTrimmed.startsWith('>') ||
          /^(-{3,}|\*{3,}|_{3,})$/.test(nextTrimmed) ||
          /^(\s*[-*+]|\s*\d+\.)\s/.test(lines[i]) ||
          (nextTrimmed.startsWith('|') && nextTrimmed.endsWith('|'))) {
        break
      }
      textLines.push(lines[i])
      i++
    }
    blocks.push({
      type: 'text',
      content: textLines.join('\n'),
      startLine,
      endLine: i,
    })
  }

  return blocks
}

// Selectable block wrapper
interface SelectableBlockProps {
  block: ContentBlock
  isSelected: boolean
  isInRange: boolean
  commentRanges: CommentRange[]
  onMouseDown: (block: ContentBlock) => void
  onMouseMove: (block: ContentBlock) => void
  children: React.ReactNode
}

function SelectableBlock({
  block,
  isSelected,
  isInRange,
  commentRanges,
  onMouseDown,
  onMouseMove,
  children
}: SelectableBlockProps) {
  const hasComment = commentRanges.length > 0

  return (
    <div
      className={`preview-block ${isSelected ? 'preview-selected' : ''} ${isInRange ? 'preview-in-range' : ''} ${hasComment ? 'has-comment' : ''}`}
      data-start-line={block.startLine}
      data-end-line={block.endLine}
      onMouseDown={(e) => {
        if ((e.target as HTMLElement).closest('.inline-comment-form, .inline-staged-comment')) return
        onMouseDown(block)
      }}
      onMouseMove={() => onMouseMove(block)}
    >
      {hasComment && (
        <div className="preview-gutter">
          {commentRanges.map((range) => (
            <span
              key={range.id}
              className={`preview-gutter-bar color-${range.colorIndex % 6}`}
            />
          ))}
        </div>
      )}
      <div className="preview-block-content">
        {children}
      </div>
    </div>
  )
}

function MarkdownPreview({
  content,
  selection,
  comments,
  onSelect,
  onCommentSubmit,
  onCommentCancel,
  onCommentRemove
}: MarkdownPreviewProps) {
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionStart, setSelectionStart] = useState<ContentBlock | null>(null)
  const [selectionEnd, setSelectionEnd] = useState<ContentBlock | null>(null)

  const blocks = useMemo(() => parseMarkdownBlocks(content), [content])

  // Get comment ranges for each block
  const commentsByBlock = useMemo(() => {
    const map = new Map<number, CommentRange[]>()
    for (const comment of comments) {
      // Find blocks that overlap with this comment
      for (const block of blocks) {
        if (block.startLine <= comment.endLine && block.endLine >= comment.startLine) {
          const existing = map.get(block.startLine) || []
          existing.push({
            id: comment.id,
            startLine: comment.startLine,
            endLine: comment.endLine,
            colorIndex: comment.colorIndex,
          })
          map.set(block.startLine, existing)
        }
      }
    }
    return map
  }, [comments, blocks])

  // Get comments that end at a specific block
  const commentsByEndBlock = useMemo(() => {
    const map = new Map<number, Array<StagedItem & { colorIndex: number }>>()
    for (const comment of comments) {
      // Find the block that contains the comment's end line
      for (const block of blocks) {
        if (block.startLine <= comment.endLine && block.endLine >= comment.endLine) {
          const existing = map.get(block.startLine) || []
          existing.push(comment)
          map.set(block.startLine, existing)
          break
        }
      }
    }
    return map
  }, [comments, blocks])

  const handleMouseDown = useCallback((block: ContentBlock) => {
    setIsSelecting(true)
    setSelectionStart(block)
    setSelectionEnd(block)
  }, [])

  const handleMouseMove = useCallback((block: ContentBlock) => {
    if (isSelecting && selectionStart) {
      setSelectionEnd(block)
    }
  }, [isSelecting, selectionStart])

  const handleMouseUp = useCallback(() => {
    if (isSelecting && selectionStart && selectionEnd) {
      const startIdx = blocks.findIndex(b => b.startLine === selectionStart.startLine)
      const endIdx = blocks.findIndex(b => b.startLine === selectionEnd.startLine)

      const minIdx = Math.min(startIdx, endIdx)
      const maxIdx = Math.max(startIdx, endIdx)

      const startBlock = blocks[minIdx]
      const endBlock = blocks[maxIdx]

      onSelect({
        startLine: startBlock.startLine,
        endLine: endBlock.endLine,
      })
    }
    setIsSelecting(false)
  }, [isSelecting, selectionStart, selectionEnd, blocks, onSelect])

  // Check if a block is selected or in range
  const isBlockSelected = useCallback((block: ContentBlock) => {
    if (!selection) return false
    return block.startLine >= selection.startLine && block.endLine <= selection.endLine
  }, [selection])

  const isBlockInRange = useCallback((block: ContentBlock) => {
    if (!isSelecting || !selectionStart || !selectionEnd) return false

    const startIdx = blocks.findIndex(b => b.startLine === selectionStart.startLine)
    const endIdx = blocks.findIndex(b => b.startLine === selectionEnd.startLine)
    const blockIdx = blocks.findIndex(b => b.startLine === block.startLine)

    const minIdx = Math.min(startIdx, endIdx)
    const maxIdx = Math.max(startIdx, endIdx)

    return blockIdx >= minIdx && blockIdx <= maxIdx
  }, [isSelecting, selectionStart, selectionEnd, blocks])

  // Find which block the selection ends at
  const selectionEndBlock = useMemo(() => {
    if (!selection) return null
    for (const block of blocks) {
      if (block.endLine >= selection.endLine && block.startLine <= selection.endLine) {
        return block
      }
    }
    return null
  }, [selection, blocks])

  return (
    <div
      className="markdown-preview"
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        if (isSelecting) {
          handleMouseUp()
        }
      }}
    >
      {blocks.map((block) => {
        const blockComments = commentsByEndBlock.get(block.startLine) || []
        const showCommentForm = selectionEndBlock?.startLine === block.startLine && selection

        return (
          <div key={`${block.startLine}-${block.endLine}`}>
            <SelectableBlock
              block={block}
              isSelected={isBlockSelected(block)}
              isInRange={isBlockInRange(block)}
              commentRanges={commentsByBlock.get(block.startLine) || []}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ className, children, ...props }) {
                    const isInline = !className
                    if (isInline) {
                      return <code className="inline-code" {...props}>{children}</code>
                    }
                    return <CodeBlock className={className}>{children}</CodeBlock>
                  },
                  a({ href, children }) {
                    return (
                      <a href={href} target="_blank" rel="noopener noreferrer">
                        {children}
                      </a>
                    )
                  },
                  img({ src, alt }) {
                    return (
                      <div className="markdown-image-placeholder">
                        <span className="markdown-image-icon">🖼</span>
                        <span className="markdown-image-alt">{alt || 'Image'}</span>
                        <span className="markdown-image-path">{src}</span>
                      </div>
                    )
                  },
                }}
              >
                {block.content}
              </ReactMarkdown>
            </SelectableBlock>

            {/* Show existing comments */}
            {blockComments.length > 0 && (
              <div className="preview-inline-comments">
                {blockComments.map((item) => (
                  <InlineStagedComment
                    key={item.id}
                    item={item}
                    onRemove={onCommentRemove}
                    className="preview-staged-comment"
                  />
                ))}
              </div>
            )}

            {/* Show comment form at selection end */}
            {showCommentForm && (
              <InlineCommentForm
                startLine={selection.startLine}
                endLine={selection.endLine}
                onSubmit={onCommentSubmit}
                onCancel={onCommentCancel}
                className="preview-comment-form"
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default MarkdownPreview
