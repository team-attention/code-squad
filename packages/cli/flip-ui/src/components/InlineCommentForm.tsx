import { useState, useRef, useEffect } from 'react'

interface InlineCommentFormProps {
  startLine: number
  endLine: number
  onSubmit: (comment: string) => void
  onCancel: () => void
  className?: string
}

function InlineCommentForm({ startLine, endLine, onSubmit, onCancel, className = '' }: InlineCommentFormProps) {
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
    <div className={`inline-comment-form ${className}`}>
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

export default InlineCommentForm
