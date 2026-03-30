import type { Document } from '../model/Document.js'
import type { Cursor } from '../model/Cursor.js'

export interface ClipboardHandlerCallbacks {
  requestRender: () => void
  scrollToCursor: () => void
}

/**
 * Handles copy/cut/paste via the hidden textarea.
 */
export class ClipboardHandler {
  constructor(
    private textarea: HTMLTextAreaElement,
    private doc: Document,
    private cursor: Cursor,
    private callbacks: ClipboardHandlerCallbacks,
  ) {
    textarea.addEventListener('copy', this.onCopy)
    textarea.addEventListener('cut', this.onCut)
    textarea.addEventListener('paste', this.onPaste)
  }

  destroy(): void {
    this.textarea.removeEventListener('copy', this.onCopy)
    this.textarea.removeEventListener('cut', this.onCut)
    this.textarea.removeEventListener('paste', this.onPaste)
  }

  private onCopy = (e: ClipboardEvent): void => {
    if (!this.cursor.hasSelection()) return
    e.preventDefault()
    const sel = this.cursor.getSelection()!
    const text = this.doc.getTextInRange(sel)
    e.clipboardData?.setData('text/plain', text)
  }

  private onCut = (e: ClipboardEvent): void => {
    if (!this.cursor.hasSelection()) return
    e.preventDefault()
    const sel = this.cursor.getSelection()!
    const text = this.doc.getTextInRange(sel)
    e.clipboardData?.setData('text/plain', text)

    const pos = this.doc.delete(sel, this.cursor.position)
    this.cursor.moveTo(pos)
    this.callbacks.requestRender()
  }

  private onPaste = (e: ClipboardEvent): void => {
    e.preventDefault()
    const text = e.clipboardData?.getData('text/plain')
    if (!text) return

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
}
