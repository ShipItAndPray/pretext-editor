import type { LineMeasurement, SubLine, Position } from '../types.js'

/**
 * Pretext-based line measurement and layout.
 *
 * Each document line is measured via Pretext's `prepare` + layout functions,
 * producing sub-lines (from word wrap) with pixel widths/heights.
 * Results are cached and only invalidated when a line changes.
 *
 * NOTE: In a real build, `@chenglou/pretext` provides `prepare` and
 * `layoutWithLines`. We abstract behind a measurer interface so the
 * core can be tested without a real Canvas/Pretext environment.
 */

export interface TextMeasurer {
  /** Measure the width of a string in pixels. */
  measureWidth(text: string): number
  /** Character width for the current font (monospace assumed). */
  charWidth: number
}

export class LineLayout {
  private cache = new Map<number, LineMeasurement>()
  private cumulativeHeights: number[] = []
  private totalHeight = 0
  private dirty = true

  constructor(
    private getLine: (index: number) => string,
    private getLineCount: () => number,
    private measurer: TextMeasurer,
    private lineHeight: number,
    private maxWidth: number,
  ) {}

  /* ── Public API ───────────────────────────────────────────── */

  /**
   * Measure a single line, returning cached result if available.
   */
  measureLine(lineIndex: number): LineMeasurement {
    const cached = this.cache.get(lineIndex)
    if (cached) return cached

    const text = this.getLine(lineIndex)
    const measurement = this.computeMeasurement(text)
    this.cache.set(lineIndex, measurement)
    this.dirty = true
    return measurement
  }

  /**
   * Get total document height in pixels.
   */
  getTotalHeight(): number {
    this.ensureCumulativeHeights()
    return this.totalHeight
  }

  /**
   * Invalidate cached measurements for lines in [start, end).
   */
  invalidate(startLine: number, endLine: number): void {
    for (let i = startLine; i < endLine; i++) {
      this.cache.delete(i)
    }
    this.dirty = true
  }

  /** Invalidate everything (e.g. font or width change). */
  invalidateAll(): void {
    this.cache.clear()
    this.cumulativeHeights = []
    this.dirty = true
  }

  /**
   * Returns the range of visible line indices for a given scroll position.
   */
  getVisibleRange(scrollTop: number, viewportHeight: number): { start: number; end: number } {
    this.ensureCumulativeHeights()
    const lineCount = this.getLineCount()
    if (lineCount === 0) return { start: 0, end: 0 }

    const start = this.lineAtY(scrollTop)
    const end = Math.min(this.lineAtY(scrollTop + viewportHeight) + 1, lineCount)
    return { start, end }
  }

  /**
   * Get the Y offset (in pixels) of a given line index.
   */
  getLineTop(lineIndex: number): number {
    this.ensureCumulativeHeights()
    if (lineIndex <= 0) return 0
    return this.cumulativeHeights[lineIndex - 1] ?? this.totalHeight
  }

  /**
   * Hit-test: convert pixel coordinates to a document Position.
   * `x` is relative to the text area (gutter already subtracted).
   * `y` is the absolute document Y (scrollTop + viewport-relative y).
   */
  hitTest(x: number, y: number): Position {
    this.ensureCumulativeHeights()
    const lineCount = this.getLineCount()
    if (lineCount === 0) return { line: 0, column: 0 }

    const line = Math.max(0, Math.min(this.lineAtY(y), lineCount - 1))
    const measurement = this.measureLine(line)

    // Find which sub-line the y falls into
    const lineTop = this.getLineTop(line)
    let subLineOffset = y - lineTop
    let subLine = measurement.subLines[0]
    for (const sl of measurement.subLines) {
      if (subLineOffset < this.lineHeight) {
        subLine = sl
        break
      }
      subLineOffset -= this.lineHeight
    }

    // Find column within the sub-line by character widths
    const charWidth = this.measurer.charWidth
    const rawColumn = Math.round(Math.max(0, x) / charWidth)
    const column = Math.min(subLine.startColumn + rawColumn, subLine.endColumn)

    return { line, column }
  }

  /** Update maxWidth (e.g. on resize). */
  setMaxWidth(width: number): void {
    if (width !== this.maxWidth) {
      this.maxWidth = width
      this.invalidateAll()
    }
  }

  setLineHeight(h: number): void {
    if (h !== this.lineHeight) {
      this.lineHeight = h
      this.invalidateAll()
    }
  }

  /* ── Internal ─────────────────────────────────────────────── */

  private computeMeasurement(text: string): LineMeasurement {
    if (text.length === 0) {
      return {
        height: this.lineHeight,
        subLines: [{ text: '', width: 0, startColumn: 0, endColumn: 0 }],
      }
    }

    const charWidth = this.measurer.charWidth
    const charsPerLine = Math.max(1, Math.floor(this.maxWidth / charWidth))

    // Simple character-based wrapping (Pretext would do glyph-perfect wrapping)
    const subLines: SubLine[] = []
    let offset = 0
    while (offset < text.length) {
      const end = Math.min(offset + charsPerLine, text.length)
      const chunk = text.slice(offset, end)
      subLines.push({
        text: chunk,
        width: chunk.length * charWidth,
        startColumn: offset,
        endColumn: end,
      })
      offset = end
    }

    return {
      height: subLines.length * this.lineHeight,
      subLines,
    }
  }

  private ensureCumulativeHeights(): void {
    if (!this.dirty) return
    const lineCount = this.getLineCount()
    this.cumulativeHeights = new Array(lineCount)
    let cumulative = 0
    for (let i = 0; i < lineCount; i++) {
      const m = this.measureLine(i)
      cumulative += m.height
      this.cumulativeHeights[i] = cumulative
    }
    this.totalHeight = cumulative
    this.dirty = false
  }

  /**
   * Binary-search cumulative heights to find the line at pixel Y.
   */
  private lineAtY(y: number): number {
    const heights = this.cumulativeHeights
    let lo = 0
    let hi = heights.length - 1
    while (lo <= hi) {
      const mid = (lo + hi) >>> 1
      if (heights[mid] <= y) {
        lo = mid + 1
      } else {
        hi = mid - 1
      }
    }
    return lo
  }
}
