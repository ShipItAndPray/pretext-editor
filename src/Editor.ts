import { Document } from './model/Document.js'
import { Cursor } from './model/Cursor.js'
import { LineLayout, type TextMeasurer } from './layout/LineLayout.js'
import { Virtualizer } from './layout/Virtualizer.js'
import { GutterLayout } from './layout/GutterLayout.js'
import { CanvasRenderer } from './render/CanvasRenderer.js'
import { KeyboardHandler } from './input/KeyboardHandler.js'
import { MouseHandler } from './input/MouseHandler.js'
import { ClipboardHandler } from './input/ClipboardHandler.js'
import { Search } from './features/Search.js'
import { LineNumbers } from './features/LineNumbers.js'
import { Wordwrap } from './features/Wordwrap.js'
import {
  type EditorState,
  type EditorTheme,
  type RenderOptions,
  DEFAULT_RENDER_OPTIONS,
} from './types.js'

export interface EditorOptions {
  font?: string
  lineHeight?: number
  readOnly?: boolean
  wordWrap?: boolean
  lineNumbers?: boolean
  theme?: Partial<EditorTheme>
  width: number
  height: number
}

/**
 * Framework-agnostic canvas text editor.
 *
 * Usage:
 * ```ts
 * const editor = new Editor(container, { width: 800, height: 600 })
 * editor.setValue('Hello, world!')
 * ```
 */
export class Editor {
  readonly doc: Document
  readonly cursor: Cursor
  readonly search: Search
  readonly lineNumbers: LineNumbers
  readonly wordwrap: Wordwrap

  private canvas: HTMLCanvasElement
  private container: HTMLElement
  private layout: LineLayout
  private virtualizer: Virtualizer
  private gutterLayout: GutterLayout
  private renderer: CanvasRenderer
  private keyboardHandler: KeyboardHandler
  private mouseHandler: MouseHandler
  private clipboardHandler: ClipboardHandler
  private renderOptions: RenderOptions
  private scrollTop = 0
  private scrollLeft = 0
  private width: number
  private height: number
  private readOnly: boolean
  private renderScheduled = false
  private charWidth = 8
  private onChange: ((value: string) => void) | null = null

  constructor(container: HTMLElement, options: EditorOptions) {
    this.container = container
    this.width = options.width
    this.height = options.height
    this.readOnly = options.readOnly ?? false

    // Merge theme
    const theme = { ...DEFAULT_RENDER_OPTIONS.theme, ...options.theme }
    this.renderOptions = {
      ...DEFAULT_RENDER_OPTIONS,
      font: options.font ?? DEFAULT_RENDER_OPTIONS.font,
      lineHeight: options.lineHeight ?? DEFAULT_RENDER_OPTIONS.lineHeight,
      theme,
    }

    // Setup container
    container.style.position = 'relative'
    container.style.overflow = 'hidden'

    // Canvas
    this.canvas = document.createElement('canvas')
    this.canvas.style.display = 'block'
    this.canvas.style.cursor = 'text'
    container.appendChild(this.canvas)

    // Measure char width
    this.charWidth = this.measureCharWidth()

    // Models
    this.doc = new Document()
    this.cursor = new Cursor()
    this.search = new Search(
      (i) => this.doc.getLine(i),
      () => this.doc.getLineCount(),
    )
    this.lineNumbers = new LineNumbers()
    this.lineNumbers.enabled = options.lineNumbers !== false
    this.wordwrap = new Wordwrap()
    this.wordwrap.enabled = options.wordWrap ?? false

    // Gutter
    this.gutterLayout = new GutterLayout()
    this.updateGutter()

    // Layout
    const measurer: TextMeasurer = {
      measureWidth: (text) => text.length * this.charWidth,
      charWidth: this.charWidth,
    }
    const textAreaWidth = this.width - this.renderOptions.gutterWidth - this.renderOptions.padding.left
    this.layout = new LineLayout(
      (i) => this.doc.getLine(i),
      () => this.doc.getLineCount(),
      measurer,
      this.renderOptions.lineHeight,
      textAreaWidth,
    )
    this.virtualizer = new Virtualizer(this.layout, () => this.doc.getLineCount())

    // Renderer
    this.renderer = new CanvasRenderer(this.canvas, this.renderOptions, this.layout, this.virtualizer)
    this.renderer.resize(this.width, this.height)

    // Input handlers
    this.keyboardHandler = new KeyboardHandler(container, this.doc, this.cursor, {
      requestRender: () => this.scheduleRender(),
      getLineLength: (i) => this.doc.getLine(i).length,
      getLineCount: () => this.doc.getLineCount(),
      scrollToCursor: () => this.scrollToCursor(),
    })
    this.mouseHandler = new MouseHandler(
      this.canvas,
      this.cursor,
      this.layout,
      this.renderOptions,
      {
        requestRender: () => this.scheduleRender(),
        focus: () => this.focus(),
        getScrollTop: () => this.scrollTop,
      },
    )
    this.clipboardHandler = new ClipboardHandler(
      this.keyboardHandler.getTextarea(),
      this.doc,
      this.cursor,
      {
        requestRender: () => this.scheduleRender(),
        scrollToCursor: () => this.scrollToCursor(),
      },
    )

    // Scroll handling
    container.addEventListener('wheel', this.onWheel, { passive: false })

    // Document change listener
    this.doc.setOnChange(() => {
      this.layout.invalidateAll()
      this.updateGutter()
      this.onChange?.(this.doc.getText())
    })

    // Initial render
    this.scheduleRender()
  }

  /* ── Public API ───────────────────────────────────────────── */

  getValue(): string {
    return this.doc.getText()
  }

  setValue(text: string): void {
    this.doc.setText(text)
    this.cursor.moveTo({ line: 0, column: 0 })
    this.scrollTop = 0
    this.scrollLeft = 0
    this.scheduleRender()
  }

  focus(): void {
    this.keyboardHandler.focus()
  }

  isFocused(): boolean {
    return this.keyboardHandler.isFocused()
  }

  setOnChange(fn: ((value: string) => void) | null): void {
    this.onChange = fn
  }

  resize(width: number, height: number): void {
    this.width = width
    this.height = height
    this.renderer.resize(width, height)
    const textAreaWidth = width - this.renderOptions.gutterWidth - this.renderOptions.padding.left
    this.layout.setMaxWidth(textAreaWidth)
    this.scheduleRender()
  }

  getScrollTop(): number {
    return this.scrollTop
  }

  setScrollTop(value: number): void {
    this.scrollTop = Math.max(0, Math.min(value, this.virtualizer.getTotalHeight() - this.height))
    this.scheduleRender()
  }

  destroy(): void {
    this.keyboardHandler.destroy()
    this.mouseHandler.destroy()
    this.clipboardHandler.destroy()
    this.container.removeEventListener('wheel', this.onWheel)
    this.canvas.remove()
  }

  /* ── Internal ─────────────────────────────────────────────── */

  private measureCharWidth(): number {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return 8
    ctx.font = this.renderOptions.font
    return ctx.measureText('M').width || 8
  }

  private updateGutter(): void {
    if (this.lineNumbers.enabled) {
      this.renderOptions.gutterWidth = this.gutterLayout.update(
        this.doc.getLineCount(),
        this.charWidth,
      )
    } else {
      this.renderOptions.gutterWidth = 0
    }
  }

  private getEditorState(): EditorState {
    return {
      doc: this.doc,
      cursor: this.cursor.position,
      selection: this.cursor.getSelection(),
      scrollTop: this.scrollTop,
      scrollLeft: this.scrollLeft,
      viewportWidth: this.width,
      viewportHeight: this.height,
      focused: this.isFocused(),
    }
  }

  private scheduleRender(): void {
    if (this.renderScheduled) return
    this.renderScheduled = true
    requestAnimationFrame(() => {
      this.renderScheduled = false
      this.renderer.render(this.getEditorState())
    })
  }

  private scrollToCursor(): void {
    const newTop = this.virtualizer.ensureVisible(
      this.cursor.position.line,
      this.scrollTop,
      this.height,
    )
    if (newTop !== null) {
      this.scrollTop = newTop
    }
  }

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault()
    const maxScroll = Math.max(0, this.virtualizer.getTotalHeight() - this.height)
    this.scrollTop = Math.max(0, Math.min(this.scrollTop + e.deltaY, maxScroll))
    this.scheduleRender()
  }
}
