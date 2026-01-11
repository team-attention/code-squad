export interface FileNode {
  path: string
  name: string
  type: 'file' | 'directory'
  children?: FileNode[]
}

export interface FilesResponse {
  root: string
  tree: FileNode[]
}

export interface FlatFilesResponse {
  files: string[]
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

export interface SubmitItem {
  filePath: string
  startLine: number
  endLine: number
  comment: string
}

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
}
