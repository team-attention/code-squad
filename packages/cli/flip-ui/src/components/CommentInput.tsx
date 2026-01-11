import { useState, useEffect, useRef } from 'react'
import type { Selection } from '../store/appStore'

interface CommentInputProps {
  selection: Selection | null
  currentFilePath: string | null
  onSubmit: (comment: string) => void
  onCancel: () => void
}

function CommentInput({
  selection,
  currentFilePath,
  onSubmit,
  onCancel,
}: CommentInputProps) {
  const [comment, setComment] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when selection changes
  useEffect(() => {
    if (selection) {
      inputRef.current?.focus()
    }
  }, [selection])

  // Clear comment when selection is cleared
  useEffect(() => {
    if (!selection) {
      setComment('')
    }
  }, [selection])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selection || !comment.trim()) return
    onSubmit(comment.trim())
    setComment('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }

  const formatSelection = () => {
    if (!selection || !currentFilePath) return ''
    const fileName = currentFilePath.split('/').pop() || currentFilePath
    if (selection.startLine === selection.endLine) {
      return `${fileName}:${selection.startLine}`
    }
    return `${fileName}:${selection.startLine}-${selection.endLine}`
  }

  return (
    <form className="comment-input" onSubmit={handleSubmit}>
      {selection ? (
        <>
          <span className="comment-selection">{formatSelection()}</span>
          <input
            ref={inputRef}
            type="text"
            className="comment-field"
            placeholder="Add comment and press Enter..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            type="submit"
            className="btn btn-small btn-primary"
            disabled={!comment.trim()}
          >
            Add
          </button>
        </>
      ) : (
        <span className="comment-hint">
          Select lines in the code viewer to add a comment
        </span>
      )}
    </form>
  )
}

export default CommentInput
