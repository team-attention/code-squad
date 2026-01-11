import { PanelLeft, PanelRight, GitCompare } from 'lucide-react'
import { useUIStore, DiffViewMode } from '../store/uiStore'

const diffModeLabels: Record<DiffViewMode, string> = {
  none: 'No Diff',
  inline: 'Inline',
  'side-by-side': 'Side by Side',
}

function Toolbar() {
  const {
    leftPanelVisible,
    rightPanelVisible,
    toggleLeftPanel,
    toggleRightPanel,
    diffViewMode,
    cycleDiffViewMode,
  } = useUIStore()

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <button
          className={`toolbar-btn ${leftPanelVisible ? 'active' : ''}`}
          onClick={toggleLeftPanel}
          title="Toggle file tree (Cmd+B)"
        >
          <PanelLeft size={16} />
        </button>
      </div>

      <div className="toolbar-center">
        <button
          className="toolbar-btn diff-toggle"
          onClick={cycleDiffViewMode}
          title="Cycle diff mode (Cmd+D)"
        >
          <GitCompare size={16} />
          <span className="diff-mode-label">{diffModeLabels[diffViewMode]}</span>
        </button>
      </div>

      <div className="toolbar-right">
        <button
          className={`toolbar-btn ${rightPanelVisible ? 'active' : ''}`}
          onClick={toggleRightPanel}
          title="Toggle staging panel (Cmd+Shift+B)"
        >
          <PanelRight size={16} />
        </button>
      </div>
    </div>
  )
}

export default Toolbar
