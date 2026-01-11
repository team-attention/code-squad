import { useCallback } from 'react'
import { useAppStore } from '../store/appStore'
import { api, type FileNode } from '../api'

function FileTree() {
  const {
    fileTree,
    expandedDirs,
    toggleDir,
    setCurrentFile,
    gitStatus,
  } = useAppStore()

  const handleFileClick = useCallback(
    async (path: string) => {
      try {
        const file = await api.getFile(path)
        setCurrentFile(file)
      } catch (err) {
        console.error('Failed to load file:', err)
      }
    },
    [setCurrentFile]
  )

  const getGitStatusForPath = (path: string) => {
    if (!gitStatus?.isGitRepo) return null
    return gitStatus.unstaged.find((f) => f.path === path)?.status ?? null
  }

  const renderNode = (node: FileNode, depth: number = 0) => {
    const isDir = node.type === 'directory'
    const isExpanded = expandedDirs.has(node.path)
    const gitStat = getGitStatusForPath(node.path)

    return (
      <div key={node.path} className="tree-node">
        <div
          className={`tree-item ${isDir ? 'tree-item-dir' : 'tree-item-file'} ${
            gitStat ? `git-${gitStat}` : ''
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            if (isDir) {
              toggleDir(node.path)
            } else {
              handleFileClick(node.path)
            }
          }}
        >
          <span className="tree-icon">
            {isDir ? (isExpanded ? '\u25BC' : '\u25B6') : '\u00B7'}
          </span>
          <span className="tree-name">{node.name}</span>
          {gitStat && (
            <span className={`git-badge git-badge-${gitStat}`}>
              {gitStat === 'modified'
                ? 'M'
                : gitStat === 'untracked'
                ? 'U'
                : gitStat === 'deleted'
                ? 'D'
                : 'A'}
            </span>
          )}
        </div>
        {isDir && isExpanded && node.children && (
          <div className="tree-children">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="file-tree">
      <div className="file-tree-header">Files</div>
      <div className="file-tree-content">
        {fileTree.map((node) => renderNode(node))}
      </div>
    </div>
  )
}

export default FileTree
