/**
 * Calculates the width needed for the line-number gutter.
 */
export class GutterLayout {
  private cachedWidth = 60

  /**
   * Recalculate gutter width based on the total number of lines.
   * Returns the width in pixels.
   */
  update(lineCount: number, charWidth: number, minWidth = 40): number {
    const digits = Math.max(2, String(lineCount).length)
    // digits + 1 for padding
    this.cachedWidth = Math.max(minWidth, (digits + 1) * charWidth + 8)
    return this.cachedWidth
  }

  getWidth(): number {
    return this.cachedWidth
  }
}
