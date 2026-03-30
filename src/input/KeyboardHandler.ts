import type { Document } from '../model/Document.js'
import type { Cursor } from '../model/Cursor.js'
import type { Position } from '../types.js'

export interface KeyboardHandlerCallbacks {
  requestRender: () => void
  getLineLength: (line: number) => number
  getLineCount: () => number
  scrollToCursor: () => void
}

/**
 * Handles keyboard input via a hidden textarea.
 *
 * The textarea is positioned invisibly over the canvas and kept focused.
 * All keyboard/IME input is captured through it — no contenteditable needed.
 */
export class KeyboardHandler {
  private textarea: HTMLTextAreaElement
  private composing = false

  constructor(
    private container: HTMLElement,
    private doc: Document,
    private cursor: Cursor,
    private callbacks: KeyboardHandlerCallbacks,
  ) {
    this.textarea = document.createElement('textarea')
    this.textarea.setAttribute('autocapitalize', 'off')
    this.textarea.setAttribute('autocomplete', 'off')
    this.textarea.setAttribute('autocorrect', 'off')
    this.textarea.setAttribute('spellcheck', 'false')
    this.textarea.setAttribute('tabindex', '0')
    Object.assign(this.textarea.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '1px',
      height: '1px',
      opacity: '0',
      padding: '0',
      border: 'none',
      outline: 'none',
      resize: 'none',
      overflow: 'hidden',
      whiteSpace: 'pre',
      zIndex: '10',
      caretColor: 'transparent',
    })

    container.appendChild(this.textarea)

    this.textarea.addEventListener('input', this.onInput)
    this.textarea.addEventListener('keydown', this.onKeyDown)
    this.textarea.addEventListener('compositionstart', () => { this.composing = true })
    this.textarea.addEventListener('compositionend', () => {
      this.composing = false
      this.onInput()
    })
  }

  focus(): void {
    this.textarea.focus()
  }

  isFocused(): boolean {
    return document.activeElement === this.textarea
  }

  getTextarea(): HTMLTextAreaElement {
    return this.textarea
  }

  destroy(): void {
    this.textarea.removeEventListener('input', this.onInput)
    this.textarea.removeEventListener('keydown', this.onKeyDown)
    this.textarea.remove()
  }

  /* ── Handlers ─────────────────────────────────────────────── */

  private onInput = (): void => {
    if (this.composing) return

    const text = this.textarea.value
    if (!text) return

    this.textarea.value = ''

    // Delete selection first if active
    if (this.cursor.hasSelection()) {
      const sel = this.cursor.getSelection()!
      this.doc.delete(sel, this.cursor.position)
      this.cursor.moveTo(sel.start)
    }

    const newPos = this.doc.insert(this.cursor.position, text, this.cursor.position)
    this.cursor.moveTo(newPos)
    this.callbacks.scrollToCursor()
    this.callbacks.requestRender()
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    const { doc, cursor, callbacks } = this
    const mod = e.metaKey || e.ctrlKey

    // Undo/Redo
    if (mod && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      const pos = doc.undo()
      if (pos) cursor.moveTo(pos)
      callbacks.requestRender()
      return
    }
    if (mod && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault()
      const pos = doc.redo()
      if (pos) cursor.moveTo(pos)
      callbacks.requestRender()
      return
    }

    // Select All
    if (mod && e.key === 'a') {
      e.preventDefault()
      const lc = callbacks.getLineCount()
      cursor.selectAll(lc, callbacks.getLineLength(lc - 1))
      callbacks.requestRender()
      return
    }

    // Arrow keys
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      this.moveLeft(e.shiftKey)
      callbacks.requestRender()
      return
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      this.moveRight(e.shiftKey)
      callbacks.requestRender()
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      this.moveUp(e.shiftKey)
      callbacks.scrollToCursor()
      callbacks.requestRender()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      this.moveDown(e.shiftKey)
      callbacks.scrollToCursor()
      callbacks.requestRender()
      return
    }

    // Home / End
    if (e.key === 'Home') {
      e.preventDefault()
      cursor.moveToLineStart(e.shiftKey)
      callbacks.requestRender()
      return
    }
    if (e.key === 'End') {
      e.preventDefault()
      cursor.moveToLineEnd(callbacks.getLineLength(cursor.position.line), e.shiftKey)
      callbacks.requestRender()
      return
    }

    // Enter
    if (e.key === 'Enter') {
      e.preventDefault()
      if (cursor.hasSelection()) {
        const sel = cursor.getSelection()!
        doc.delete(sel, cursor.position)
        cursor.moveTo(sel.start)
      }
      const newPos = doc.insert(cursor.position, '\n', cursor.position)
      cursor.moveTo(newPos)
      callbacks.scrollToCursor()
      callbacks.requestRender()
      return
    }

    // Backspace
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (cursor.hasSelection()) {
        const sel = cursor.getSelection()!
        const pos = doc.delete(sel, cursor.position)
        cursor.moveTo(pos)
      } else {
        const pos = cursor.position
        if (pos.column > 0) {
          const range = {
            start: { line: pos.line, column: pos.column - 1 },
            end: pos,
          }
          doc.delete(range, pos)
          cursor.moveTo(range.start)
        } else if (pos.line > 0) {
          const prevLen = callbacks.getLineLength(pos.line - 1)
          const range = {
            start: { line: pos.line - 1, column: prevLen },
            end: pos,
          }
          doc.delete(range, pos)
          cursor.moveTo(range.start)
        }
      }
      callbacks.scrollToCursor()
      callbacks.requestRender()
      return
    }

    // Delete
    if (e.key === 'Delete') {
      e.preventDefault()
      if (cursor.hasSelection()) {
        const sel = cursor.getSelection()!
        const pos = doc.delete(sel, cursor.position)
        cursor.moveTo(pos)
      } else {
        const pos = cursor.position
        const lineLen = callbacks.getLineLength(pos.line)
        if (pos.column < lineLen) {
          doc.delete(
            { start: pos, end: { line: pos.line, column: pos.column + 1 } },
            pos,
          )
        } else if (pos.line < callbacks.getLineCount() - 1) {
          doc.delete(
            { start: pos, end: { line: pos.line + 1, column: 0 } },
            pos,
          )
        }
      }
      callbacks.requestRender()
      return
    }

    // Tab
    if (e.key === 'Tab') {
      e.preventDefault()
      if (cursor.hasSelection()) {
        const sel = cursor.getSelection()!
        doc.delete(sel, cursor.position)
        cursor.moveTo(sel.start)
      }
      const newPos = doc.insert(cursor.position, '  ', cursor.position)
      cursor.moveTo(newPos)
      callbacks.requestRender()
      return
    }
  }

  /* ── Movement helpers ─────────────────────────────────────── */

  private moveLeft(selecting: boolean): void {
    const { cursor, callbacks } = this
    const pos = cursor.position
    let newPos: Position
    if (pos.column > 0) {
      newPos = { line: pos.line, column: pos.column - 1 }
    } else if (pos.line > 0) {
      newPos = { line: pos.line - 1, column: callbacks.getLineLength(pos.line - 1) }
    } else {
      return
    }
    cursor.moveTo(newPos, selecting)
  }

  private moveRight(selecting: boolean): void {
    const { cursor, callbacks } = this
    const pos = cursor.position
    const lineLen = callbacks.getLineLength(pos.line)
    let newPos: Position
    if (pos.column < lineLen) {
      newPos = { line: pos.line, column: pos.column + 1 }
    } else if (pos.line < callbacks.getLineCount() - 1) {
      newPos = { line: pos.line + 1, column: 0 }
    } else {
      return
    }
    cursor.moveTo(newPos, selecting)
  }

  private moveUp(selecting: boolean): void {
    const { cursor } = this
    const pos = cursor.position
    if (pos.line > 0) {
      const newLine = pos.line - 1
      const col = Math.min(pos.column, this.callbacks.getLineLength(newLine))
      cursor.moveTo({ line: newLine, column: col }, selecting)
    }
  }

  private moveDown(selecting: boolean): void {
    const { cursor, callbacks } = this
    const pos = cursor.position
    if (pos.line < callbacks.getLineCount() - 1) {
      const newLine = pos.line + 1
      const col = Math.min(pos.column, callbacks.getLineLength(newLine))
      cursor.moveTo({ line: newLine, column: col }, selecting)
    }
  }
}
