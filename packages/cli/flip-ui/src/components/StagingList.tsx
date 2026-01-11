import { X, MessageSquare } from 'lucide-react'
import { useStagingStore } from '../store/stagingStore'

function StagingList() {
  const { items, removeItem, clear } = useStagingStore()

  const formatLocation = (filePath: string, startLine: number, endLine: number) => {
    const fileName = filePath.split('/').pop() || filePath
    if (startLine === endLine) {
      return `${fileName}:${startLine}`
    }
    return `${fileName}:${startLine}-${endLine}`
  }

  if (items.length === 0) {
    return (
      <div className="staging-list staging-list-empty">
        <div className="staging-header">Staged Selections</div>
        <div className="empty-state">
          <MessageSquare size={32} className="empty-state-icon" />
          <p className="staging-hint">
            Select lines in the code viewer and add a comment to stage them
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="staging-list">
      <div className="staging-header">
        <span>Staged Selections ({items.length})</span>
        <button className="btn-link" onClick={clear}>
          Clear all
        </button>
      </div>
      <div className="staging-items">
        {items.map((item) => (
          <div key={item.id} className="staging-item">
            <div className="staging-item-header">
              <span className="staging-location">
                {formatLocation(item.filePath, item.startLine, item.endLine)}
              </span>
              <button
                className="btn-icon"
                onClick={() => removeItem(item.id)}
                title="Remove"
              >
                <X size={14} />
              </button>
            </div>
            <div className="staging-comment">{item.comment}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default StagingList
