import type { Position, Range } from '../types.js'

/** An entry on the undo/redo stack. */
interface EditOperation {
  /** Lines before the edit. */
  before: string[]
  /** Lines after the edit. */
  after: string[]
  /** Cursor position before the edit. */
  cursorBefore: Position
  /** Cursor position after the edit. */
  cursorAfter: Position
}

/**
 * Line-based document model with undo/redo.
 *
 * Internally stores text as an array of lines (without newline terminators).
 * All mutations go through `insert` and `delete` which record undo history.
 */
export class Document {
  private lines: string[]
  private undoStack: EditOperation[] = []
  private redoStack: EditOperation[] = []
  private onChange: (() => void) | null = null

  constructor(text = '') {
    this.lines = text.split('\n')
  }

  /* ── Queries ──────────────────────────────────────────────── */

  getLine(index: number): string {
    return this.lines[index] ?? ''
  }

  getLineCount(): number {
    return this.lines.length
  }

  getText(): string {
    return this.lines.join('\n')
  }

  getTextInRange(range: Range): string {
    if (range.start.line === range.end.line) {
      return this.lines[range.start.line].slice(range.start.column, range.end.column)
    }
    const result: string[] = []
    result.push(this.lines[range.start.line].slice(range.start.column))
    for (let i = range.start.line + 1; i < range.end.line; i++) {
      result.push(this.lines[i])
    }
    result.push(this.lines[range.end.line].slice(0, range.end.column))
    return result.join('\n')
  }

  /* ── Mutations ────────────────────────────────────────────── */

  setText(text: string): void {
    this.lines = text.split('\n')
    this.undoStack = []
    this.redoStack = []
    this.notify()
  }

  /**
   * Insert `text` at `position`. Returns the position after the inserted text.
   */
  insert(position: Position, text: string, cursorBefore?: Position): Position {
    const before = this.lines.slice()
    const insertLines = text.split('\n')

    const line = this.lines[position.line]
    const prefix = line.slice(0, position.column)
    const suffix = line.slice(position.column)

    if (insertLines.length === 1) {
      this.lines[position.line] = prefix + insertLines[0] + suffix
    } else {
      const firstLine = prefix + insertLines[0]
      const lastLine = insertLines[insertLines.length - 1] + suffix
      const middleLines = insertLines.slice(1, -1)
      this.lines.splice(position.line, 1, firstLine, ...middleLines, lastLine)
    }

    const endLine = position.line + insertLines.length - 1
    const endColumn =
      insertLines.length === 1
        ? position.column + insertLines[0].length
        : insertLines[insertLines.length - 1].length

    const cursorAfter: Position = { line: endLine, column: endColumn }

    this.undoStack.push({
      before,
      after: this.lines.slice(),
      cursorBefore: cursorBefore ?? position,
      cursorAfter,
    })
    this.redoStack = []
    this.notify()

    return cursorAfter
  }

  /**
   * Delete text in `range`. Returns the start position of the deleted range.
   */
  delete(range: Range, cursorBefore?: Position): Position {
    const before = this.lines.slice()
    const startLine = this.lines[range.start.line]
    const endLine = this.lines[range.end.line]

    const merged = startLine.slice(0, range.start.column) + endLine.slice(range.end.column)
    this.lines.splice(range.start.line, range.end.line - range.start.line + 1, merged)

    this.undoStack.push({
      before,
      after: this.lines.slice(),
      cursorBefore: cursorBefore ?? range.end,
      cursorAfter: range.start,
    })
    this.redoStack = []
    this.notify()

    return range.start
  }

  /* ── Undo / Redo ──────────────────────────────────────────── */

  undo(): Position | null {
    const op = this.undoStack.pop()
    if (!op) return null
    this.redoStack.push(op)
    this.lines = op.before.slice()
    this.notify()
    return op.cursorBefore
  }

  redo(): Position | null {
    const op = this.redoStack.pop()
    if (!op) return null
    this.undoStack.push(op)
    this.lines = op.after.slice()
    this.notify()
    return op.cursorAfter
  }

  canUndo(): boolean {
    return this.undoStack.length > 0
  }

  canRedo(): boolean {
    return this.redoStack.length > 0
  }

  /* ── Events ───────────────────────────────────────────────── */

  setOnChange(fn: (() => void) | null): void {
    this.onChange = fn
  }

  private notify(): void {
    this.onChange?.()
  }
}
