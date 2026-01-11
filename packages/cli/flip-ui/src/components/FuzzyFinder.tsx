import { useState, useEffect, useRef, useMemo } from 'react'
import Fuse from 'fuse.js'
import { useAppStore } from '../store/appStore'
import { api } from '../api'

function FuzzyFinder() {
  const { flatFiles, setCurrentFile, setShowFuzzyFinder } = useAppStore()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Fuse.js instance
  const fuse = useMemo(() => {
    return new Fuse(flatFiles, {
      threshold: 0.4,
      distance: 100,
    })
  }, [flatFiles])

  // Filtered results
  const results = useMemo(() => {
    if (!query.trim()) {
      return flatFiles.slice(0, 20)
    }
    return fuse.search(query).slice(0, 20).map((r) => r.item)
  }, [query, fuse, flatFiles])

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [results])

  const handleSelect = async (path: string) => {
    try {
      const file = await api.getFile(path)
      setCurrentFile(file)
      setShowFuzzyFinder(false)
    } catch (err) {
      console.error('Failed to load file:', err)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setShowFuzzyFinder(false)
        break
    }
  }

  return (
    <div className="fuzzy-finder-overlay" onClick={() => setShowFuzzyFinder(false)}>
      <div className="fuzzy-finder" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          type="text"
          className="fuzzy-finder-input"
          placeholder="Search files..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="fuzzy-finder-results">
          {results.map((path, idx) => (
            <div
              key={path}
              className={`fuzzy-finder-item ${
                idx === selectedIndex ? 'fuzzy-finder-item-selected' : ''
              }`}
              onClick={() => handleSelect(path)}
              onMouseEnter={() => setSelectedIndex(idx)}
            >
              {path}
            </div>
          ))}
          {results.length === 0 && (
            <div className="fuzzy-finder-empty">No files found</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FuzzyFinder
