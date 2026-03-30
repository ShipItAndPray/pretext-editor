import type { LineLayout } from './LineLayout.js'

/**
 * Determines which lines are visible and should be rendered,
 * with a configurable overscan buffer for smooth scrolling.
 */
export class Virtualizer {
  /** Number of extra lines to render above/below the viewport. */
  overscan: number

  constructor(
    private layout: LineLayout,
    private getLineCount: () => number,
    overscan = 5,
  ) {
    this.overscan = overscan
  }

  /**
   * Get the range of lines to render given scroll position and viewport.
   */
  getVisibleRange(scrollTop: number, viewportHeight: number): { start: number; end: number } {
    const { start, end } = this.layout.getVisibleRange(scrollTop, viewportHeight)
    const lineCount = this.getLineCount()

    return {
      start: Math.max(0, start - this.overscan),
      end: Math.min(lineCount, end + this.overscan),
    }
  }

  /**
   * Total scrollable height of the document.
   */
  getTotalHeight(): number {
    return this.layout.getTotalHeight()
  }

  /**
   * Ensure a given line is scrolled into view. Returns the new scrollTop,
   * or null if no scroll adjustment needed.
   */
  ensureVisible(
    lineIndex: number,
    scrollTop: number,
    viewportHeight: number,
  ): number | null {
    const lineTop = this.layout.getLineTop(lineIndex)
    const m = this.layout.measureLine(lineIndex)
    const lineBottom = lineTop + m.height

    if (lineTop < scrollTop) {
      return lineTop
    }
    if (lineBottom > scrollTop + viewportHeight) {
      return lineBottom - viewportHeight
    }
    return null
  }
}
