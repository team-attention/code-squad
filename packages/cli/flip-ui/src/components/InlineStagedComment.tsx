import type { StagedItem } from '../store/stagingStore'

interface InlineStagedCommentProps {
  item: StagedItem & { colorIndex?: number }
  onRemove: (id: string) => void
  className?: string
}

function InlineStagedComment({ item, onRemove, className = '' }: InlineStagedCommentProps) {
  const lineDisplay =
    item.startLine === item.endLine
      ? `Lines ${item.startLine}`
      : `Lines ${item.startLine}-${item.endLine}`

  const colorClass = item.colorIndex !== undefined ? `color-${item.colorIndex % 6}` : ''

  return (
    <div className={`inline-staged-comment ${colorClass} ${className}`}>
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

export default InlineStagedComment
