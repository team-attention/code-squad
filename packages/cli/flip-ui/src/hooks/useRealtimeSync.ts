import { useEffect, useRef } from 'react'
import { api } from '../api'
import { useAppStore } from '../store/appStore'

const POLL_INTERVAL_MS = 2000

export function useRealtimeSync(): void {
  const { currentFile, setFileTree, setFlatFiles, setGitStatus, setCurrentFile } = useAppStore()
  const currentFileRef = useRef(currentFile)

  // Keep ref in sync with currentFile
  useEffect(() => {
    currentFileRef.current = currentFile
  }, [currentFile])

  useEffect(() => {
    let mounted = true

    const poll = async () => {
      if (!mounted) return

      try {
        const changes = await api.getChanges()

        if (!mounted) return

        // Refresh files if changed
        if (changes.filesChanged) {
          const [filesRes, flatRes] = await Promise.all([
            api.getFiles(),
            api.getFlatFiles(),
          ])
          if (mounted) {
            setFileTree(filesRes.tree)
            setFlatFiles(flatRes.files, flatRes.filteredDirs, flatRes.recentFile ?? null)
          }
        }

        // Refresh current file if it changed
        if (currentFileRef.current && changes.changedFiles.includes(currentFileRef.current.path)) {
          const file = await api.getFile(currentFileRef.current.path)
          if (mounted) {
            setCurrentFile(file)
          }
        }

        // Refresh git status if changed
        if (changes.gitChanged) {
          const gitRes = await api.getGitStatus()
          if (mounted) {
            setGitStatus(gitRes)
          }
        }
      } catch (err) {
        // Session might be gone, ignore errors
        console.error('Polling error:', err)
      }
    }

    const intervalId = setInterval(poll, POLL_INTERVAL_MS)

    return () => {
      mounted = false
      clearInterval(intervalId)
    }
  }, [setFileTree, setFlatFiles, setGitStatus, setCurrentFile])
}
