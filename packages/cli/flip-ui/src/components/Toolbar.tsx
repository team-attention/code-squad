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
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M0 2.5A.5.5 0 0 1 .5 2H2a.5.5 0 0 1 .5.5v.5h11a.5.5 0 0 1 0 1h-11v.5a.5.5 0 0 1-.5.5H.5a.5.5 0 0 1-.5-.5v-2zM0 7.5A.5.5 0 0 1 .5 7H2a.5.5 0 0 1 .5.5v.5h11a.5.5 0 0 1 0 1h-11v.5a.5.5 0 0 1-.5.5H.5a.5.5 0 0 1-.5-.5v-2zM.5 12a.5.5 0 0 0-.5.5v2a.5.5 0 0 0 .5.5H2a.5.5 0 0 0 .5-.5V14h11a.5.5 0 0 0 0-1h-11v-.5a.5.5 0 0 0-.5-.5H.5z" />
          </svg>
        </button>
      </div>

      <div className="toolbar-center">
        <button
          className="toolbar-btn diff-toggle"
          onClick={cycleDiffViewMode}
          title="Cycle diff mode (Cmd+D)"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
          </svg>
          <span className="diff-mode-label">{diffModeLabels[diffViewMode]}</span>
        </button>
      </div>

      <div className="toolbar-right">
        <button
          className={`toolbar-btn ${rightPanelVisible ? 'active' : ''}`}
          onClick={toggleRightPanel}
          title="Toggle staging panel (Cmd+Shift+B)"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z" />
            <path d="M10.97 4.97a.75.75 0 0 1 1.071 1.05l-3.992 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.235.235 0 0 1 .02-.022z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default Toolbar
