import { useState, useEffect } from 'react'
import { createHighlighter, type Highlighter, type ThemedToken } from 'shiki'

export interface TokenSpan {
  content: string
  color: string
  fontStyle?: 'italic' | 'bold'
}

export interface HighlightedLine {
  lineNumber: number
  tokens: TokenSpan[]
}

interface UseShikiOptions {
  code: string
  language: string
}

// Singleton highlighter promise
let highlighterPromise: Promise<Highlighter> | null = null

// Language mapping for common extensions
const languageMap: Record<string, string> = {
  js: 'javascript',
  jsx: 'jsx',
  ts: 'typescript',
  tsx: 'tsx',
  py: 'python',
  rb: 'ruby',
  rs: 'rust',
  go: 'go',
  java: 'java',
  kt: 'kotlin',
  swift: 'swift',
  c: 'c',
  cpp: 'cpp',
  h: 'c',
  hpp: 'cpp',
  cs: 'csharp',
  php: 'php',
  html: 'html',
  css: 'css',
  scss: 'scss',
  less: 'less',
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  md: 'markdown',
  markdown: 'markdown',
  sql: 'sql',
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',
  dockerfile: 'dockerfile',
  xml: 'xml',
  vue: 'vue',
  svelte: 'svelte',
}

async function getShikiHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-dark'],
      langs: [
        'typescript',
        'javascript',
        'tsx',
        'jsx',
        'python',
        'rust',
        'go',
        'java',
        'kotlin',
        'swift',
        'c',
        'cpp',
        'csharp',
        'php',
        'ruby',
        'html',
        'css',
        'scss',
        'less',
        'json',
        'yaml',
        'markdown',
        'sql',
        'bash',
        'dockerfile',
        'xml',
        'vue',
        'svelte',
      ],
    })
  }
  return highlighterPromise
}

function normalizeLanguage(lang: string): string {
  const lower = lang.toLowerCase()
  return languageMap[lower] || lower
}

function convertTokens(themedTokens: ThemedToken[]): TokenSpan[] {
  return themedTokens.map((token) => ({
    content: token.content,
    color: token.color || '#e6edf3',
    fontStyle: token.fontStyle === 1 ? 'italic' : token.fontStyle === 2 ? 'bold' : undefined,
  }))
}

export function useShiki({ code, language }: UseShikiOptions) {
  const [lines, setLines] = useState<HighlightedLine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    async function highlight() {
      try {
        setLoading(true)
        const highlighter = await getShikiHighlighter()

        if (cancelled) return

        const normalizedLang = normalizeLanguage(language)

        // Check if language is supported
        const loadedLangs = highlighter.getLoadedLanguages()
        const langToUse = loadedLangs.includes(normalizedLang) ? normalizedLang : 'text'

        // Load language if not already loaded and it's a known language
        if (!loadedLangs.includes(normalizedLang) && normalizedLang !== 'text') {
          try {
            await highlighter.loadLanguage(normalizedLang as Parameters<typeof highlighter.loadLanguage>[0])
          } catch {
            // Language not available, will fall back to text
          }
        }

        const tokens = highlighter.codeToTokens(code, {
          lang: langToUse as Parameters<typeof highlighter.codeToTokens>[1]['lang'],
          theme: 'github-dark',
        })

        if (cancelled) return

        const highlighted: HighlightedLine[] = tokens.tokens.map((lineTokens, idx) => ({
          lineNumber: idx + 1,
          tokens: convertTokens(lineTokens),
        }))

        setLines(highlighted)
        setError(null)
      } catch (err) {
        if (!cancelled) {
          console.error('Shiki highlighting error:', err)
          setError(err as Error)

          // Fallback: simple line splitting without highlighting
          const fallbackLines: HighlightedLine[] = code.split('\n').map((line, idx) => ({
            lineNumber: idx + 1,
            tokens: [{ content: line || ' ', color: '#e6edf3' }],
          }))
          setLines(fallbackLines)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    highlight()
    return () => {
      cancelled = true
    }
  }, [code, language])

  return { lines, loading, error }
}
