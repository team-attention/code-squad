import { useEffect, useState } from 'react'
import FileTree from './components/FileTree'
import CodeViewer from './components/CodeViewer'
import StagingList from './components/StagingList'
import FuzzyFinder from './components/FuzzyFinder'
import Toolbar from './components/Toolbar'
import { useAppStore } from './store/appStore'
import { useStagingStore } from './store/stagingStore'
import { useUIStore } from './store/uiStore'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useRealtimeSync } from './hooks/useRealtimeSync'
import { api } from './api'

function App() {
  const {
    setFileTree,
    setFlatFiles,
    setGitStatus,
    setCurrentFile,
    showFuzzyFinder,
    setShowFuzzyFinder,
  } = useAppStore()

  const { items: stagedItems } = useStagingStore()

  const {
    leftPanelVisible,
    rightPanelVisible,
    toggleLeftPanel,
    toggleRightPanel,
    toggleAllPanels,
    toggleGitFilter,
    cycleDiffViewMode,
  } = useUIStore()

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Enable real-time file sync via SSE
  useRealtimeSync()

  // Get session ID from URL query parameter
  const sessionId = new URLSearchParams(window.location.search).get('session') || ''

  // Load initial data and auto-select most recently modified file
  useEffect(() => {
    const loadData = async () => {
      try {
        const [filesRes, flatRes, gitRes] = await Promise.all([
          api.getFiles(),
          api.getFlatFiles(),
          api.getGitStatus(),
        ])
        setFileTree(filesRes.tree)
        setFlatFiles(flatRes.files, flatRes.filteredDirs, flatRes.recentFile)
        setGitStatus(gitRes)

        // Auto-select the most recently modified file
        if (flatRes.recentFile) {
          try {
            const file = await api.getFile(flatRes.recentFile)
            setCurrentFile(file)
          } catch (err) {
            console.error('Failed to load recent file:', err)
          }
        }
      } catch (err) {
        console.error('Failed to load data:', err)
      }
    }
    loadData()
  }, [setFileTree, setFlatFiles, setGitStatus, setCurrentFile])

  // Handle keyboard shortcuts
  useKeyboardShortcuts({
    onFuzzyFinderToggle: () => setShowFuzzyFinder(!showFuzzyFinder),
    onCancel: async () => {
      try {
        await api.cancel()
        window.close()
      } catch (err) {
        console.error('Failed to cancel:', err)
      }
    },
    onSubmit: async () => {
      if (stagedItems.length === 0) return
      setIsSubmitting(true)
      try {
        await api.submit(sessionId, stagedItems)
        window.close()
      } catch (err) {
        console.error('Failed to submit:', err)
        setIsSubmitting(false)
      }
    },
    onToggleLeftPanel: toggleLeftPanel,
    onToggleRightPanel: toggleRightPanel,
    onToggleAllPanels: toggleAllPanels,
    onToggleGitFilter: toggleGitFilter,
    onCycleDiffMode: cycleDiffViewMode,
  })

  const handleSubmit = async () => {
    if (stagedItems.length === 0) return
    setIsSubmitting(true)
    try {
      await api.submit(sessionId, stagedItems)
      window.close()
    } catch (err) {
      console.error('Failed to submit:', err)
      setIsSubmitting(false)
    }
  }

  const handleCancel = async () => {
    try {
      await api.cancel()
      window.close()
    } catch (err) {
      console.error('Failed to cancel:', err)
    }
  }

  return (
    <div className="app">
      <Toolbar />
      <div className="main-content">
        <aside className={`sidebar ${!leftPanelVisible ? 'collapsed' : ''}`}>
          <FileTree />
        </aside>
        <main className="content">
          <CodeViewer />
        </main>
        <aside className={`staging-panel ${!rightPanelVisible ? 'collapsed' : ''}`}>
          <StagingList />
        </aside>
      </div>
      <footer className="footer">
        <span className="footer-hint">
          Select lines in the code viewer to add a comment
        </span>
        <div className="footer-actions">
          <button className="btn btn-secondary" onClick={handleCancel}>
            Cancel (q)
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={stagedItems.length === 0 || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : `Submit (${stagedItems.length})`}
          </button>
        </div>
      </footer>
      {showFuzzyFinder && <FuzzyFinder />}
    </div>
  )
}

export default App
