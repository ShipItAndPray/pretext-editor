import type { Range, RenderOptions, LineMeasurement } from '../types.js'
import type { LineLayout } from '../layout/LineLayout.js'

/**
 * Renders selection highlight rectangles on the canvas.
 */
export class SelectionRenderer {
  constructor(
    private ctx: CanvasRenderingContext2D,
    private options: RenderOptions,
    private layout: LineLayout,
  ) {}

  renderLineSelection(
    selection: Range,
    lineIndex: number,
    lineTop: number,
    gutterWidth: number,
    viewportWidth: number,
    lineHeight: number,
    measurement: LineMeasurement,
  ): void {
    const { start, end } = selection
    if (lineIndex < start.line || lineIndex > end.line) return

    this.ctx.fillStyle = this.options.theme.selection

    for (let si = 0; si < measurement.subLines.length; si++) {
      const sub = measurement.subLines[si]
      const subTop = lineTop + si * lineHeight

      let startCol = sub.startColumn
      let endCol = sub.endColumn

      if (lineIndex === start.line) {
        startCol = Math.max(startCol, start.column)
      }
      if (lineIndex === end.line) {
        endCol = Math.min(endCol, end.column)
      }

      if (startCol >= endCol && !(lineIndex > start.line && lineIndex < end.line)) continue

      const charWidth = this.layout.measureLine(lineIndex).subLines[0]?.width
        ? measurement.subLines[0].width / Math.max(1, measurement.subLines[0].text.length)
        : 8

      const x = gutterWidth + this.options.padding.left + (startCol - sub.startColumn) * charWidth
      const w =
        lineIndex > start.line && lineIndex < end.line
          ? viewportWidth - gutterWidth
          : (endCol - startCol) * charWidth

      this.ctx.fillRect(x, subTop, Math.max(w, charWidth), lineHeight)
    }
  }
}
