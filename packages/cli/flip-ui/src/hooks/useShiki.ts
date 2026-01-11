import { useState, useEffect } from 'react'
import hljs from 'highlight.js/lib/core'

// Import common languages
import typescript from 'highlight.js/lib/languages/typescript'
import javascript from 'highlight.js/lib/languages/javascript'
import python from 'highlight.js/lib/languages/python'
import rust from 'highlight.js/lib/languages/rust'
import go from 'highlight.js/lib/languages/go'
import java from 'highlight.js/lib/languages/java'
import kotlin from 'highlight.js/lib/languages/kotlin'
import swift from 'highlight.js/lib/languages/swift'
import c from 'highlight.js/lib/languages/c'
import cpp from 'highlight.js/lib/languages/cpp'
import csharp from 'highlight.js/lib/languages/csharp'
import php from 'highlight.js/lib/languages/php'
import ruby from 'highlight.js/lib/languages/ruby'
import html from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import scss from 'highlight.js/lib/languages/scss'
import less from 'highlight.js/lib/languages/less'
import json from 'highlight.js/lib/languages/json'
import yaml from 'highlight.js/lib/languages/yaml'
import markdown from 'highlight.js/lib/languages/markdown'
import sql from 'highlight.js/lib/languages/sql'
import bash from 'highlight.js/lib/languages/bash'
import dockerfile from 'highlight.js/lib/languages/dockerfile'
import makefile from 'highlight.js/lib/languages/makefile'
import xml from 'highlight.js/lib/languages/xml'
import graphql from 'highlight.js/lib/languages/graphql'
import ini from 'highlight.js/lib/languages/ini'
import diff from 'highlight.js/lib/languages/diff'

// Register languages
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('python', python)
hljs.registerLanguage('rust', rust)
hljs.registerLanguage('go', go)
hljs.registerLanguage('java', java)
hljs.registerLanguage('kotlin', kotlin)
hljs.registerLanguage('swift', swift)
hljs.registerLanguage('c', c)
hljs.registerLanguage('cpp', cpp)
hljs.registerLanguage('csharp', csharp)
hljs.registerLanguage('php', php)
hljs.registerLanguage('ruby', ruby)
hljs.registerLanguage('html', html)
hljs.registerLanguage('css', css)
hljs.registerLanguage('scss', scss)
hljs.registerLanguage('less', less)
hljs.registerLanguage('json', json)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('markdown', markdown)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('dockerfile', dockerfile)
hljs.registerLanguage('makefile', makefile)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('graphql', graphql)
hljs.registerLanguage('ini', ini)
hljs.registerLanguage('diff', diff)

// Aliases
hljs.registerLanguage('tsx', typescript)
hljs.registerLanguage('jsx', javascript)
hljs.registerLanguage('ts', typescript)
hljs.registerLanguage('js', javascript)
hljs.registerLanguage('py', python)
hljs.registerLanguage('rb', ruby)
hljs.registerLanguage('sh', bash)
hljs.registerLanguage('shell', bash)
hljs.registerLanguage('zsh', bash)

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

// VSCode Dark+ theme colors
const themeColors: Record<string, string> = {
  'hljs-keyword': '#569cd6',
  'hljs-built_in': '#4ec9b0',
  'hljs-type': '#4ec9b0',
  'hljs-literal': '#569cd6',
  'hljs-number': '#b5cea8',
  'hljs-operator': '#d4d4d4',
  'hljs-punctuation': '#d4d4d4',
  'hljs-property': '#9cdcfe',
  'hljs-regexp': '#d16969',
  'hljs-string': '#ce9178',
  'hljs-char.escape_': '#d7ba7d',
  'hljs-subst': '#d4d4d4',
  'hljs-symbol': '#b5cea8',
  'hljs-class': '#4ec9b0',
  'hljs-function': '#dcdcaa',
  'hljs-variable': '#9cdcfe',
  'hljs-variable.language_': '#569cd6',
  'hljs-variable.constant_': '#4fc1ff',
  'hljs-title': '#dcdcaa',
  'hljs-title.class_': '#4ec9b0',
  'hljs-title.class_.inherited__': '#4ec9b0',
  'hljs-title.function_': '#dcdcaa',
  'hljs-params': '#9cdcfe',
  'hljs-comment': '#6a9955',
  'hljs-doctag': '#608b4e',
  'hljs-meta': '#9cdcfe',
  'hljs-meta.prompt_': '#9cdcfe',
  'hljs-meta.keyword': '#569cd6',
  'hljs-meta.string': '#ce9178',
  'hljs-section': '#569cd6',
  'hljs-tag': '#569cd6',
  'hljs-name': '#569cd6',
  'hljs-attr': '#9cdcfe',
  'hljs-attribute': '#9cdcfe',
  'hljs-selector-tag': '#d7ba7d',
  'hljs-selector-id': '#d7ba7d',
  'hljs-selector-class': '#d7ba7d',
  'hljs-selector-attr': '#d7ba7d',
  'hljs-selector-pseudo': '#d7ba7d',
  'hljs-template-tag': '#569cd6',
  'hljs-template-variable': '#9cdcfe',
  'hljs-addition': '#b5cea8',
  'hljs-deletion': '#ce9178',
  'hljs-emphasis': '#d4d4d4',
  'hljs-strong': '#d4d4d4',
  'hljs-link': '#569cd6',
  'hljs-quote': '#6a9955',
}

const defaultColor = '#d4d4d4'

function getColorForClass(className: string): string {
  // Try exact match first
  if (themeColors[className]) {
    return themeColors[className]
  }
  // Try base class (e.g., 'hljs-title' from 'hljs-title.function_')
  const baseClass = className.split('.')[0]
  if (themeColors[baseClass]) {
    return themeColors[baseClass]
  }
  return defaultColor
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
}

// Language normalization mapping
const languageMap: Record<string, string> = {
  plaintext: 'plaintext',
  text: 'plaintext',
  typescript: 'typescript',
  javascript: 'javascript',
  tsx: 'tsx',
  jsx: 'jsx',
  python: 'python',
  rust: 'rust',
  go: 'go',
  java: 'java',
  kotlin: 'kotlin',
  swift: 'swift',
  c: 'c',
  cpp: 'cpp',
  csharp: 'csharp',
  php: 'php',
  ruby: 'ruby',
  html: 'html',
  css: 'css',
  scss: 'scss',
  less: 'less',
  json: 'json',
  yaml: 'yaml',
  markdown: 'markdown',
  sql: 'sql',
  bash: 'bash',
  shell: 'bash',
  sh: 'bash',
  zsh: 'bash',
  dockerfile: 'dockerfile',
  makefile: 'makefile',
  xml: 'xml',
  graphql: 'graphql',
  ini: 'ini',
  diff: 'diff',
  gitignore: 'ini',
  dotenv: 'ini',
  toml: 'ini',
}

function normalizeLanguage(lang: string): string {
  const lower = lang.toLowerCase()
  return languageMap[lower] || 'plaintext'
}

export function useShiki({ code, language }: UseShikiOptions) {
  const [lines, setLines] = useState<HighlightedLine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    function highlight() {
      try {
        setLoading(true)
        const normalizedLang = normalizeLanguage(language)

        if (normalizedLang === 'plaintext') {
          const plainLines: HighlightedLine[] = code.split('\n').map((line, idx) => ({
            lineNumber: idx + 1,
            tokens: [{ content: line || ' ', color: defaultColor }],
          }))
          if (!cancelled) {
            setLines(plainLines)
            setError(null)
          }
          return
        }

        // Highlight the entire code at once to handle multi-line constructs (comments, strings)
        const result = hljs.highlight(code, { language: normalizedLang, ignoreIllegals: true })

        // Split highlighted HTML by newlines while preserving token context
        const highlighted = splitHighlightedLines(result.value)

        if (!cancelled) {
          setLines(highlighted)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Highlighting error:', err)
          setError(err as Error)

          // Fallback
          const fallbackLines: HighlightedLine[] = code.split('\n').map((line, idx) => ({
            lineNumber: idx + 1,
            tokens: [{ content: line || ' ', color: defaultColor }],
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

// Split highlighted HTML into lines while preserving color context across newlines
function splitHighlightedLines(html: string): HighlightedLine[] {
  const lines: HighlightedLine[] = []
  const colorStack: string[] = [defaultColor]
  let currentLine: TokenSpan[] = []
  let currentText = ''
  let lineNumber = 1
  let i = 0

  const flushText = () => {
    if (currentText) {
      currentLine.push({
        content: decodeHtmlEntities(currentText),
        color: colorStack[colorStack.length - 1],
      })
      currentText = ''
    }
  }

  const flushLine = () => {
    if (currentLine.length === 0) {
      currentLine.push({ content: ' ', color: defaultColor })
    }
    lines.push({ lineNumber, tokens: currentLine })
    lineNumber++
    currentLine = []
  }

  while (i < html.length) {
    if (html.startsWith('<span class="', i)) {
      flushText()

      const classStart = i + 13
      const classEnd = html.indexOf('"', classStart)
      const className = html.substring(classStart, classEnd)

      colorStack.push(getColorForClass(className))
      i = html.indexOf('>', classEnd) + 1
    } else if (html.startsWith('</span>', i)) {
      flushText()

      if (colorStack.length > 1) {
        colorStack.pop()
      }
      i += 7
    } else if (html[i] === '\n') {
      flushText()
      flushLine()
      i++
    } else {
      currentText += html[i]
      i++
    }
  }

  // Flush remaining
  flushText()
  if (currentLine.length > 0 || lines.length === 0) {
    if (currentLine.length === 0) {
      currentLine.push({ content: ' ', color: defaultColor })
    }
    lines.push({ lineNumber, tokens: currentLine })
  }

  return lines
}
