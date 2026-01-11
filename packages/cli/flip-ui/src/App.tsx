import { useEffect, useState } from 'react'
import FileTree from './components/FileTree'
import CodeViewer from './components/CodeViewer'
import StagingList from './components/StagingList'
import CommentInput from './components/CommentInput'
import FuzzyFinder from './components/FuzzyFinder'
import { useAppStore } from './store/appStore'
import { useStagingStore } from './store/stagingStore'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { api } from './api'

function App() {
  const {
    currentFile,
    selection,
    setFileTree,
    setFlatFiles,
    setGitStatus,
    showFuzzyFinder,
    setShowFuzzyFinder,
    clearSelection,
  } = useAppStore()

  const { items: stagedItems, addItem } = useStagingStore()

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get session ID from URL query parameter
  const sessionId = new URLSearchParams(window.location.search).get('session') || ''

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [filesRes, flatRes, gitRes] = await Promise.all([
          api.getFiles(),
          api.getFlatFiles(),
          api.getGitStatus(),
        ])
        setFileTree(filesRes.tree)
        setFlatFiles(flatRes.files)
        setGitStatus(gitRes)
      } catch (err) {
        console.error('Failed to load data:', err)
      }
    }
    loadData()
  }, [setFileTree, setFlatFiles, setGitStatus])

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
  })

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
      <div className="main-content">
        <aside className="sidebar">
          <FileTree />
        </aside>
        <main className="content">
          <CodeViewer />
        </main>
        <aside className="staging-panel">
          <StagingList />
        </aside>
      </div>
      <footer className="footer">
        <CommentInput
          selection={selection}
          currentFilePath={currentFile?.path ?? null}
          onSubmit={handleCommentSubmit}
          onCancel={clearSelection}
        />
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
