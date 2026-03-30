/**
 * Soft word-wrap logic.
 *
 * Given a line of text and a maximum width, splits the line into sub-lines.
 * In a full Pretext integration, this would use `layoutNextLine` for
 * glyph-perfect breaks. Here we implement character-based wrapping with
 * word-boundary preference.
 */
export interface WrapResult {
  /** The wrapped segments. */
  segments: string[]
  /** Start columns for each segment in the original line. */
  startColumns: number[]
}

export class Wordwrap {
  enabled = false

  /**
   * Wrap a line of text to fit within `maxChars` characters.
   */
  wrap(text: string, maxChars: number): WrapResult {
    if (!this.enabled || text.length <= maxChars) {
      return {
        segments: [text],
        startColumns: [0],
      }
    }

    const segments: string[] = []
    const startColumns: number[] = []
    let offset = 0

    while (offset < text.length) {
      let end = offset + maxChars
      if (end >= text.length) {
        segments.push(text.slice(offset))
        startColumns.push(offset)
        break
      }

      // Try to break at a word boundary
      let breakAt = end
      for (let i = end; i > offset + Math.floor(maxChars * 0.5); i--) {
        if (text[i] === ' ' || text[i] === '\t') {
          breakAt = i + 1
          break
        }
      }

      segments.push(text.slice(offset, breakAt))
      startColumns.push(offset)
      offset = breakAt
    }

    return { segments, startColumns }
  }
}
