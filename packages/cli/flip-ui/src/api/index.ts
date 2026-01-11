export interface FileNode {
  path: string
  name: string
  type: 'file' | 'directory'
  filtered?: boolean
  children?: FileNode[]
}

export interface FilesResponse {
  root: string
  tree: FileNode[]
}

export interface FlatFilesResponse {
  files: string[]
  filteredDirs: string[]
}

export interface FileResponse {
  path: string
  content: string
  language: string
}

export interface GitStatusResponse {
  isGitRepo: boolean
  unstaged: Array<{
    path: string
    status: 'modified' | 'untracked' | 'deleted' | 'added'
  }>
}

export interface DiffLine {
  type: 'context' | 'add' | 'delete'
  content: string
  oldLineNumber?: number
  newLineNumber?: number
}

export interface DiffHunk {
  oldStart: number
  oldLines: number
  newStart: number
  newLines: number
  lines: DiffLine[]
}

export interface FileDiff {
  hunks: DiffHunk[]
  status: 'modified' | 'added' | 'deleted' | 'untracked'
}

export interface SubmitItem {
  filePath: string
  startLine: number
  endLine: number
  comment: string
}

// SSE Event types
export type FilesChangeEvent = {
  type: 'files-changed'
}

export type FileContentEvent = {
  type: 'file-changed'
  path: string
}

export type GitChangeEvent = {
  type: 'git-changed'
}

export type ConnectedEvent = {
  type: 'connected'
}

export type SyncEvent = FilesChangeEvent | FileContentEvent | GitChangeEvent | ConnectedEvent

export const api = {
  async getFiles(): Promise<FilesResponse> {
    const res = await fetch('/api/files')
    if (!res.ok) throw new Error('Failed to fetch files')
    return res.json()
  },

  async getFlatFiles(): Promise<FlatFilesResponse> {
    const res = await fetch('/api/files/flat')
    if (!res.ok) throw new Error('Failed to fetch flat files')
    return res.json()
  },

  async getFile(path: string): Promise<FileResponse> {
    const res = await fetch(`/api/file?path=${encodeURIComponent(path)}`)
    if (!res.ok) throw new Error('Failed to fetch file')
    return res.json()
  },

  async getGitStatus(): Promise<GitStatusResponse> {
    const res = await fetch('/api/git/status')
    if (!res.ok) throw new Error('Failed to fetch git status')
    return res.json()
  },

  async getFileDiff(path: string): Promise<FileDiff> {
    const res = await fetch(`/api/git/diff?path=${encodeURIComponent(path)}`)
    if (!res.ok) {
      if (res.status === 404) {
        return { hunks: [], status: 'modified' }
      }
      throw new Error('Failed to fetch diff')
    }
    return res.json()
  },

  async submit(sessionId: string, items: SubmitItem[]): Promise<void> {
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, items }),
    })
    if (!res.ok) throw new Error('Failed to submit')
  },

  async cancel(): Promise<void> {
    const res = await fetch('/api/cancel', { method: 'POST' })
    if (!res.ok) throw new Error('Failed to cancel')
  },

  subscribeEvents(onEvent: (event: SyncEvent) => void): () => void {
    const eventSource = new EventSource('/api/events')

    eventSource.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as SyncEvent
        onEvent(event)
      } catch (err) {
        console.error('Failed to parse SSE event:', err)
      }
    }

    eventSource.onerror = (err) => {
      console.error('SSE connection error:', err)
    }

    return () => {
      eventSource.close()
    }
  },
}
