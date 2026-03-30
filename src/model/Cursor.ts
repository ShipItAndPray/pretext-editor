import type { Position, Range } from '../types.js'

/**
 * Manages cursor position and text selection.
 */
export class Cursor {
  /** Current cursor (caret) position. */
  position: Position = { line: 0, column: 0 }

  /** Anchor for selection — if non-null, selection is from anchor to position. */
  anchor: Position | null = null

  /* ── Movement ─────────────────────────────────────────────── */

  moveTo(pos: Position, selecting = false): void {
    if (selecting) {
      if (!this.anchor) this.anchor = { ...this.position }
    } else {
      this.anchor = null
    }
    this.position = { ...pos }
  }

  moveToLineStart(selecting = false): void {
    this.moveTo({ line: this.position.line, column: 0 }, selecting)
  }

  moveToLineEnd(lineLength: number, selecting = false): void {
    this.moveTo({ line: this.position.line, column: lineLength }, selecting)
  }

  /* ── Selection ────────────────────────────────────────────── */

  hasSelection(): boolean {
    if (!this.anchor) return false
    return this.anchor.line !== this.position.line || this.anchor.column !== this.position.column
  }

  getSelection(): Range | null {
    if (!this.hasSelection() || !this.anchor) return null
    return Cursor.orderedRange(this.anchor, this.position)
  }

  clearSelection(): void {
    this.anchor = null
  }

  selectAll(lineCount: number, lastLineLength: number): void {
    this.anchor = { line: 0, column: 0 }
    this.position = { line: lineCount - 1, column: lastLineLength }
  }

  /* ── Helpers ──────────────────────────────────────────────── */

  static orderedRange(a: Position, b: Position): Range {
    if (a.line < b.line || (a.line === b.line && a.column <= b.column)) {
      return { start: { ...a }, end: { ...b } }
    }
    return { start: { ...b }, end: { ...a } }
  }

  static comparePositions(a: Position, b: Position): number {
    if (a.line !== b.line) return a.line - b.line
    return a.column - b.column
  }

  /** Clamp position within document bounds. */
  static clamp(pos: Position, lineCount: number, getLineLength: (i: number) => number): Position {
    const line = Math.max(0, Math.min(pos.line, lineCount - 1))
    const column = Math.max(0, Math.min(pos.column, getLineLength(line)))
    return { line, column }
  }
}
