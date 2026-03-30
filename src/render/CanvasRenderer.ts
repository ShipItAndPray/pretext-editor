import type { EditorState, RenderOptions } from '../types.js'
import type { LineLayout } from '../layout/LineLayout.js'
import type { Virtualizer } from '../layout/Virtualizer.js'
import { SelectionRenderer } from './SelectionRenderer.js'
import { CursorRenderer } from './CursorRenderer.js'

/**
 * Renders the entire editor onto a Canvas 2D context.
 */
export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D
  private selectionRenderer: SelectionRenderer
  private cursorRenderer: CursorRenderer
  private dpr: number

  constructor(
    private canvas: HTMLCanvasElement,
    private options: RenderOptions,
    private layout: LineLayout,
    private virtualizer: Virtualizer,
  ) {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Failed to get 2D context')
    this.ctx = ctx
    this.dpr = typeof devicePixelRatio !== 'undefined' ? devicePixelRatio : 1
    this.selectionRenderer = new SelectionRenderer(ctx, options, layout)
    this.cursorRenderer = new CursorRenderer(ctx, options)
  }

  /**
   * Full render pass.
   */
  render(state: EditorState): void {
    const { ctx, options, dpr } = this
    const { theme, lineHeight, gutterWidth, padding, font } = options

    // Scale for device pixel ratio
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // Clear
    ctx.fillStyle = theme.background
    ctx.fillRect(0, 0, state.viewportWidth, state.viewportHeight)

    // Gutter background
    ctx.fillStyle = theme.gutterBackground
    ctx.fillRect(0, 0, gutterWidth, state.viewportHeight)

    ctx.font = font

    const { start, end } = this.virtualizer.getVisibleRange(
      state.scrollTop,
      state.viewportHeight,
    )

    for (let i = start; i < end; i++) {
      const lineTop = this.layout.getLineTop(i) - state.scrollTop
      const lineText = state.doc.getLine(i)
      const measurement = this.layout.measureLine(i)

      // Current line highlight
      if (i === state.cursor.line) {
        ctx.fillStyle = theme.currentLine
        ctx.fillRect(gutterWidth, lineTop, state.viewportWidth - gutterWidth, measurement.height)
      }

      // Selection highlight
      if (state.selection) {
        this.selectionRenderer.renderLineSelection(
          state.selection,
          i,
          lineTop,
          gutterWidth,
          state.viewportWidth,
          lineHeight,
          measurement,
        )
      }

      // Line number
      ctx.fillStyle = theme.lineNumber
      ctx.textBaseline = 'top'
      ctx.textAlign = 'right'
      ctx.fillText(
        String(i + 1),
        gutterWidth - 8,
        lineTop + (lineHeight - 14) / 2, // rough vertical center
      )

      // Text
      ctx.fillStyle = theme.foreground
      ctx.textAlign = 'left'
      for (const sub of measurement.subLines) {
        const subTop =
          lineTop + measurement.subLines.indexOf(sub) * lineHeight
        ctx.fillText(
          sub.text,
          gutterWidth + padding.left - state.scrollLeft,
          subTop + (lineHeight - 14) / 2,
        )
      }
    }

    // Cursor
    if (state.focused) {
      const cursorLineTop = this.layout.getLineTop(state.cursor.line) - state.scrollTop
      this.cursorRenderer.render(
        state.cursor,
        cursorLineTop,
        gutterWidth + padding.left - state.scrollLeft,
        lineHeight,
      )
    }
  }

  /**
   * Resize the canvas to match its container.
   */
  resize(width: number, height: number): void {
    this.canvas.width = width * this.dpr
    this.canvas.height = height * this.dpr
    this.canvas.style.width = `${width}px`
    this.canvas.style.height = `${height}px`
  }

  updateOptions(options: Partial<RenderOptions>): void {
    Object.assign(this.options, options)
  }
}
