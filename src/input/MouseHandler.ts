import type { Cursor } from '../model/Cursor.js'
import type { LineLayout } from '../layout/LineLayout.js'
import type { RenderOptions } from '../types.js'

export interface MouseHandlerCallbacks {
  requestRender: () => void
  focus: () => void
  getScrollTop: () => number
}

/**
 * Handles mouse interactions on the canvas.
 * Converts click coordinates to document positions via LineLayout.hitTest.
 */
export class MouseHandler {
  private dragging = false

  constructor(
    private canvas: HTMLCanvasElement,
    private cursor: Cursor,
    private layout: LineLayout,
    private options: RenderOptions,
    private callbacks: MouseHandlerCallbacks,
  ) {
    canvas.addEventListener('mousedown', this.onMouseDown)
    canvas.addEventListener('mousemove', this.onMouseMove)
    window.addEventListener('mouseup', this.onMouseUp)
  }

  destroy(): void {
    this.canvas.removeEventListener('mousedown', this.onMouseDown)
    this.canvas.removeEventListener('mousemove', this.onMouseMove)
    window.removeEventListener('mouseup', this.onMouseUp)
  }

  private toDocPosition(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect()
    const x = e.clientX - rect.left - this.options.gutterWidth - this.options.padding.left
    const y = e.clientY - rect.top + this.callbacks.getScrollTop()
    return this.layout.hitTest(x, y)
  }

  private onMouseDown = (e: MouseEvent): void => {
    e.preventDefault()
    this.callbacks.focus()
    this.dragging = true

    const pos = this.toDocPosition(e)
    this.cursor.moveTo(pos, e.shiftKey)
    this.callbacks.requestRender()
  }

  private onMouseMove = (e: MouseEvent): void => {
    if (!this.dragging) return

    const pos = this.toDocPosition(e)
    this.cursor.moveTo(pos, true)
    this.callbacks.requestRender()
  }

  private onMouseUp = (): void => {
    this.dragging = false
  }
}
