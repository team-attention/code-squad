import { useCallback, useMemo } from 'react'
import {
  ChevronRight,
  ChevronDown,
  File,
  FileCode,
  FileJson,
  FileText,
  FileType,
  Folder,
  FolderOpen,
  GitBranch,
  Image,
  Settings,
} from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { useUIStore } from '../store/uiStore'
import { api, type FileNode } from '../api'

// Get file icon based on file extension
function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase()

  switch (ext) {
    // Code files
    case 'ts':
    case 'tsx':
      return <FileCode size={14} style={{ color: '#3178c6' }} />
    case 'js':
    case 'jsx':
      return <FileCode size={14} style={{ color: '#f7df1e' }} />
    case 'py':
      return <FileCode size={14} style={{ color: '#3776ab' }} />
    case 'go':
      return <FileCode size={14} style={{ color: '#00add8' }} />
    case 'rs':
      return <FileCode size={14} style={{ color: '#dea584' }} />
    case 'java':
      return <FileCode size={14} style={{ color: '#b07219' }} />
    case 'rb':
      return <FileCode size={14} style={{ color: '#cc342d' }} />
    case 'php':
      return <FileCode size={14} style={{ color: '#4f5d95' }} />
    case 'css':
    case 'scss':
    case 'sass':
    case 'less':
      return <FileCode size={14} style={{ color: '#563d7c' }} />
    case 'html':
    case 'htm':
      return <FileCode size={14} style={{ color: '#e34c26' }} />
    case 'vue':
      return <FileCode size={14} style={{ color: '#41b883' }} />
    case 'svelte':
      return <FileCode size={14} style={{ color: '#ff3e00' }} />

    // Data files
    case 'json':
      return <FileJson size={14} style={{ color: '#cbcb41' }} />
    case 'yaml':
    case 'yml':
      return <FileType size={14} style={{ color: '#cb171e' }} />
    case 'xml':
      return <FileType size={14} style={{ color: '#0060ac' }} />
    case 'toml':
      return <FileType size={14} style={{ color: '#9c4221' }} />

    // Document files
    case 'md':
    case 'mdx':
      return <FileText size={14} style={{ color: '#519aba' }} />
    case 'txt':
      return <FileText size={14} />

    // Image files
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'webp':
    case 'ico':
      return <Image size={14} style={{ color: '#a074c4' }} />

    // Config files
    case 'env':
    case 'gitignore':
    case 'eslintrc':
    case 'prettierrc':
      return <Settings size={14} style={{ color: '#6e7681' }} />

    // Default
    default:
      return <File size={14} />
  }
}

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
    const isFiltered = node.filtered === true
    const gitStat = getGitStatusForPath(node.path)

    return (
      <div key={node.path} className="tree-node">
        <div
          className={`tree-item ${isDir ? 'tree-item-dir' : 'tree-item-file'} ${
            gitStat ? `git-${gitStat}` : ''
          } ${isFiltered ? 'tree-item-filtered' : ''}`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          title={isFiltered ? 'Not loaded for performance' : undefined}
          onClick={() => {
            if (isFiltered) return
            if (isDir) {
              toggleDir(node.path)
            } else {
              handleFileClick(node.path)
            }
          }}
        >
          <span className="tree-icon">
            {isDir ? (
              isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
            ) : (
              getFileIcon(node.name)
            )}
          </span>
          {isDir && (
            <span className="tree-folder-icon">
              {isExpanded ? <FolderOpen size={14} /> : <Folder size={14} />}
            </span>
          )}
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
              <GitBranch size={12} />
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
