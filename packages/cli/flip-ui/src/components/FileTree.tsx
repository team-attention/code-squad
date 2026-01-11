import { useCallback, useMemo } from 'react'
import { useAppStore } from '../store/appStore'
import { useUIStore } from '../store/uiStore'
import { api, type FileNode } from '../api'

// Filter tree to only include paths with git changes
function filterTreeToChangedFiles(
  tree: FileNode[],
  changedPaths: Set<string>
): FileNode[] {
  return tree
    .map((node) => {
      if (node.type === 'file') {
        return changedPaths.has(node.path) ? node : null
      }

      // For directories, recursively filter children
      const filteredChildren = node.children
        ? filterTreeToChangedFiles(node.children, changedPaths)
        : []

      // Only include directory if it has changed children
      if (filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren,
        }
      }

      return null
    })
    .filter((node): node is FileNode => node !== null)
}

function FileTree() {
  const {
    fileTree,
    expandedDirs,
    toggleDir,
    setCurrentFile,
    gitStatus,
  } = useAppStore()

  const { showOnlyGitChanged, toggleGitFilter } = useUIStore()

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

  // Get all changed file paths
  const changedPaths = useMemo(() => {
    if (!gitStatus?.isGitRepo) return new Set<string>()
    return new Set(gitStatus.unstaged.map((f) => f.path))
  }, [gitStatus])

  // Count of changed files
  const changedCount = changedPaths.size

  // Filter tree if git filter is active
  const displayTree = useMemo(() => {
    if (!showOnlyGitChanged || changedPaths.size === 0) {
      return fileTree
    }
    return filterTreeToChangedFiles(fileTree, changedPaths)
  }, [fileTree, showOnlyGitChanged, changedPaths])

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
      <div className="file-tree-header">
        <span>Files</span>
        {gitStatus?.isGitRepo && changedCount > 0 && (
          <div className="file-tree-header-actions">
            <button
              className={`filter-btn ${showOnlyGitChanged ? 'active' : ''}`}
              onClick={toggleGitFilter}
              title="Show only changed files (Cmd+G)"
            >
              Git
              <span className="count">{changedCount}</span>
            </button>
          </div>
        )}
      </div>
      <div className="file-tree-content">
        {displayTree.length === 0 ? (
          <div className="staging-list-empty">
            <p className="staging-hint">No files to display</p>
          </div>
        ) : (
          displayTree.map((node) => renderNode(node))
        )}
      </div>
    </div>
  )
}

export default FileTree
