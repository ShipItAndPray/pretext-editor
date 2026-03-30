import type { Position, RenderOptions } from '../types.js'

/**
 * Renders a blinking cursor on the canvas.
 */
export class CursorRenderer {
  private visible = true
  private blinkTimer: ReturnType<typeof setInterval> | null = null

  constructor(
    private ctx: CanvasRenderingContext2D,
    private options: RenderOptions,
  ) {}

  render(
    cursor: Position,
    lineTop: number,
    textStartX: number,
    lineHeight: number,
    charWidth?: number,
  ): void {
    if (!this.visible) return

    const cw = charWidth ?? 8
    const x = textStartX + cursor.column * cw
    const y = lineTop
    const h = lineHeight

    this.ctx.fillStyle = this.options.theme.cursor
    this.ctx.fillRect(x, y, 2, h)
  }

  startBlinking(renderFn: () => void): void {
    this.stopBlinking()
    this.visible = true
    this.blinkTimer = setInterval(() => {
      this.visible = !this.visible
      renderFn()
    }, 530)
  }

  stopBlinking(): void {
    if (this.blinkTimer) {
      clearInterval(this.blinkTimer)
      this.blinkTimer = null
    }
    this.visible = true
  }

  /** Reset blink cycle (cursor becomes visible on keystroke). */
  resetBlink(renderFn: () => void): void {
    this.visible = true
    this.startBlinking(renderFn)
  }
}
