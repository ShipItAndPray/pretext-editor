import { useRef, useEffect, useCallback, type CSSProperties } from 'react'
import { Editor, type EditorOptions } from './Editor.js'
import type { EditorTheme } from './types.js'

export interface PretextEditorProps {
  value: string
  onChange: (value: string) => void
  font?: string
  lineHeight?: number
  readOnly?: boolean
  wordWrap?: boolean
  lineNumbers?: boolean
  theme?: Partial<EditorTheme>
  width: number
  height: number
  className?: string
  style?: CSSProperties
}

/**
 * React wrapper around the core Editor.
 *
 * ```tsx
 * <PretextEditor
 *   value={code}
 *   onChange={setCode}
 *   width={800}
 *   height={600}
 * />
 * ```
 */
export function PretextEditor(props: PretextEditorProps) {
  const {
    value,
    onChange,
    font,
    lineHeight,
    readOnly,
    wordWrap,
    lineNumbers,
    theme,
    width,
    height,
    className,
    style,
  } = props

  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<Editor | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  // Create editor
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const options: EditorOptions = {
      font,
      lineHeight,
      readOnly,
      wordWrap,
      lineNumbers,
      theme,
      width,
      height,
    }

    const editor = new Editor(container, options)
    editor.setOnChange((val) => onChangeRef.current(val))
    editor.setValue(value)
    editorRef.current = editor

    return () => {
      editor.destroy()
      editorRef.current = null
    }
    // Only recreate on structural changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [font, lineHeight, readOnly, wordWrap, lineNumbers])

  // Sync value from outside
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    if (editor.getValue() !== value) {
      editor.setValue(value)
    }
  }, [value])

  // Resize
  useEffect(() => {
    editorRef.current?.resize(width, height)
  }, [width, height])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width,
        height,
        ...style,
      }}
    />
  )
}
