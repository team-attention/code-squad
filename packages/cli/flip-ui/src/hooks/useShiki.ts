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

// Language normalization mapping (backend language -> Shiki language)
const languageMap: Record<string, string> = {
  // Handle plaintext/text fallback
  plaintext: 'text',
  text: 'text',

  // JavaScript/TypeScript
  javascript: 'javascript',
  typescript: 'typescript',
  jsx: 'jsx',
  tsx: 'tsx',

  // Systems
  rust: 'rust',
  go: 'go',
  c: 'c',
  cpp: 'cpp',

  // JVM
  java: 'java',
  kotlin: 'kotlin',
  scala: 'scala',
  groovy: 'groovy',

  // Scripting
  python: 'python',
  ruby: 'ruby',
  php: 'php',
  perl: 'perl',
  lua: 'lua',

  // Mobile
  swift: 'swift',
  'objective-c': 'objective-c',
  'objective-cpp': 'objective-cpp',
  dart: 'dart',

  // Web
  html: 'html',
  css: 'css',
  scss: 'scss',
  sass: 'sass',
  less: 'less',
  vue: 'vue',
  svelte: 'svelte',
  astro: 'astro',

  // Data formats
  json: 'json',
  jsonc: 'jsonc',
  yaml: 'yaml',
  toml: 'toml',
  xml: 'xml',
  csv: 'csv',

  // Documentation
  markdown: 'markdown',
  mdx: 'mdx',
  rst: 'rst',
  latex: 'latex',

  // Shell
  bash: 'bash',
  fish: 'fish',
  powershell: 'powershell',
  batch: 'bat',

  // Database/Query
  sql: 'sql',
  prisma: 'prisma',
  graphql: 'graphql',

  // Config
  ini: 'ini',
  dotenv: 'dotenv',

  // Build/DevOps
  dockerfile: 'dockerfile',
  makefile: 'makefile',
  cmake: 'cmake',

  // Version control
  gitignore: 'gitignore',
  gitattributes: 'gitattributes',

  // Diff
  diff: 'diff',

  // Editor config
  editorconfig: 'editorconfig',

  // C#
  csharp: 'csharp',
}

async function getShikiHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-dark'],
      langs: [
        // Core languages - loaded immediately
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
        'makefile',
        'xml',
        'vue',
        'svelte',
        'graphql',
        'toml',
        'ini',
        'diff',
        'gitignore',
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
