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

export interface FileWithMtime {
  path: string
  mtime: number
}

export interface FlatFilesResponse {
  files: FileWithMtime[]
  filteredDirs: string[]
  recentFile: string | null
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

export interface ChangesResponse {
  filesChanged: boolean
  gitChanged: boolean
  changedFiles: string[]
}

// Get session ID from URL (cached)
let cachedSessionId: string | null = null
function getSessionId(): string {
  if (cachedSessionId === null) {
    cachedSessionId = new URLSearchParams(window.location.search).get('session') || ''
  }
  return cachedSessionId
}

function withSession(url: string): string {
  const sessionId = getSessionId()
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}session_id=${encodeURIComponent(sessionId)}`
}

export const api = {
  getSessionId,

  async getFiles(): Promise<FilesResponse> {
    const res = await fetch(withSession('/api/files'))
    if (!res.ok) throw new Error('Failed to fetch files')
    return res.json()
  },

  async getFlatFiles(): Promise<FlatFilesResponse> {
    const res = await fetch(withSession('/api/files/flat'))
    if (!res.ok) throw new Error('Failed to fetch flat files')
    return res.json()
  },

  async getFile(path: string): Promise<FileResponse> {
    const res = await fetch(withSession(`/api/file?path=${encodeURIComponent(path)}`))
    if (!res.ok) throw new Error('Failed to fetch file')
    return res.json()
  },

  async getGitStatus(): Promise<GitStatusResponse> {
    const res = await fetch(withSession('/api/git/status'))
    if (!res.ok) throw new Error('Failed to fetch git status')
    return res.json()
  },

  async getFileDiff(path: string): Promise<FileDiff> {
    const res = await fetch(withSession(`/api/git/diff?path=${encodeURIComponent(path)}`))
    if (!res.ok) {
      if (res.status === 404) {
        return { hunks: [], status: 'modified' }
      }
      throw new Error('Failed to fetch diff')
    }
    return res.json()
  },

  async getChanges(): Promise<ChangesResponse> {
    const res = await fetch(withSession('/api/changes'))
    if (!res.ok) throw new Error('Failed to fetch changes')
    return res.json()
  },

  async submit(items: SubmitItem[]): Promise<void> {
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: getSessionId(), items }),
    })
    if (!res.ok) throw new Error('Failed to submit')
  },

  async cancel(): Promise<void> {
    const res = await fetch('/api/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: getSessionId() }),
    })
    if (!res.ok) throw new Error('Failed to cancel')
  },
}
