import { create } from 'zustand'
import type { FileNode, FileResponse, GitStatusResponse } from '../api'

export interface Selection {
  startLine: number
  endLine: number
}

interface AppState {
  // File tree
  fileTree: FileNode[]
  flatFiles: string[]
  filteredDirs: string[]
  expandedDirs: Set<string>
  setFileTree: (tree: FileNode[]) => void
  setFlatFiles: (files: string[], filteredDirs: string[]) => void
  toggleDir: (path: string) => void

  // Current file
  currentFile: FileResponse | null
  setCurrentFile: (file: FileResponse | null) => void

  // Selection
  selection: Selection | null
  setSelection: (selection: Selection | null) => void
  clearSelection: () => void

  // Git status
  gitStatus: GitStatusResponse | null
  setGitStatus: (status: GitStatusResponse) => void

  // Fuzzy finder
  showFuzzyFinder: boolean
  setShowFuzzyFinder: (show: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  // File tree
  fileTree: [],
  flatFiles: [],
  filteredDirs: [],
  expandedDirs: new Set<string>(),
  setFileTree: (tree) => set({ fileTree: tree }),
  setFlatFiles: (files, filteredDirs) => set({ flatFiles: files, filteredDirs }),
  toggleDir: (path) =>
    set((state) => {
      const newExpanded = new Set(state.expandedDirs)
      if (newExpanded.has(path)) {
        newExpanded.delete(path)
      } else {
        newExpanded.add(path)
      }
      return { expandedDirs: newExpanded }
    }),

  // Current file
  currentFile: null,
  setCurrentFile: (file) => set({ currentFile: file, selection: null }),

  // Selection
  selection: null,
  setSelection: (selection) => set({ selection }),
  clearSelection: () => set({ selection: null }),

  // Git status
  gitStatus: null,
  setGitStatus: (status) => set({ gitStatus: status }),

  // Fuzzy finder
  showFuzzyFinder: false,
  setShowFuzzyFinder: (show) => set({ showFuzzyFinder: show }),
}))
