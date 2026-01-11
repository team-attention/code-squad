import { useState, useEffect } from 'react'
import { api, type FileDiff } from '../api'

interface UseDiffOptions {
  filePath: string | null
  enabled: boolean
}

export function useDiff({ filePath, enabled }: UseDiffOptions) {
  const [diff, setDiff] = useState<FileDiff | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!enabled || !filePath) {
      setDiff(null)
      return
    }

    let cancelled = false

    async function fetchDiff() {
      try {
        setLoading(true)
        setError(null)
        const result = await api.getFileDiff(filePath!)

        if (!cancelled) {
          setDiff(result)
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to fetch diff:', err)
          setError(err as Error)
          setDiff(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchDiff()

    return () => {
      cancelled = true
    }
  }, [filePath, enabled])

  return { diff, loading, error }
}
