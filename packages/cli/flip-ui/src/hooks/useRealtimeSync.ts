import { useEffect, useRef } from 'react'
import { api, SyncEvent } from '../api'
import { useAppStore } from '../store/appStore'

export function useRealtimeSync(): void {
  const { currentFile, setFileTree, setFlatFiles, setGitStatus, setCurrentFile } = useAppStore()
  const currentFileRef = useRef(currentFile)

  // Keep ref in sync with currentFile
  useEffect(() => {
    currentFileRef.current = currentFile
  }, [currentFile])

  useEffect(() => {
    const handleEvent = async (event: SyncEvent) => {
      switch (event.type) {
        case 'connected':
          // Connection established, no action needed
          break

        case 'files-changed':
          try {
            const [filesRes, flatRes] = await Promise.all([
              api.getFiles(),
              api.getFlatFiles(),
            ])
            setFileTree(filesRes.tree)
            setFlatFiles(flatRes.files, flatRes.filteredDirs)
          } catch (err) {
            console.error('Failed to refresh files:', err)
          }
          break

        case 'file-changed':
          // Only refresh if it's the currently viewed file
          if (currentFileRef.current?.path === event.path) {
            try {
              const file = await api.getFile(event.path)
              setCurrentFile(file)
            } catch (err) {
              console.error('Failed to refresh current file:', err)
            }
          }
          break

        case 'git-changed':
          try {
            const gitRes = await api.getGitStatus()
            setGitStatus(gitRes)
          } catch (err) {
            console.error('Failed to refresh git status:', err)
          }
          break
      }
    }

    const unsubscribe = api.subscribeEvents(handleEvent)

    return () => {
      unsubscribe()
    }
  }, [setFileTree, setFlatFiles, setGitStatus, setCurrentFile])
}
