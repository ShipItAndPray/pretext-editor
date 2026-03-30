/**
 * Line number rendering configuration.
 * Actual rendering is done inline by CanvasRenderer; this module provides
 * helpers for formatting and width calculation.
 */
export class LineNumbers {
  enabled = true

  /**
   * Format a line number for display.
   * Can support relative line numbers, padding, etc.
   */
  format(lineIndex: number, cursorLine?: number, relative = false): string {
    if (!this.enabled) return ''

    const num = lineIndex + 1
    if (relative && cursorLine !== undefined) {
      if (lineIndex === cursorLine) return String(num)
      return String(Math.abs(lineIndex - cursorLine))
    }
    return String(num)
  }

  /**
   * Calculate the minimum gutter width needed for the given line count.
   */
  gutterWidth(lineCount: number, charWidth: number): number {
    const digits = Math.max(2, String(lineCount).length)
    return (digits + 1.5) * charWidth
  }
}
