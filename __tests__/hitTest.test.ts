import { describe, it, expect } from 'vitest'
import { LineLayout, type TextMeasurer } from '../src/layout/LineLayout.js'

function createLayout(lines: string[], charWidth = 8, lineHeight = 20) {
  const measurer: TextMeasurer = {
    measureWidth: (text) => text.length * charWidth,
    charWidth,
  }
  return new LineLayout(
    (i) => lines[i] ?? '',
    () => lines.length,
    measurer,
    lineHeight,
    800,
  )
}

describe('hitTest', () => {
  it('should return (0,0) for origin click on empty doc', () => {
    const layout = createLayout([''])
    const pos = layout.hitTest(0, 0)
    expect(pos).toEqual({ line: 0, column: 0 })
  })

  it('should map click to correct line', () => {
    const layout = createLayout(['first', 'second', 'third'])
    // Click at y=30 should be line 1 (each line is 20px)
    const pos = layout.hitTest(0, 30)
    expect(pos.line).toBe(1)
  })

  it('should map click to correct column', () => {
    const layout = createLayout(['hello world'], 8, 20)
    // Click at x=40 with charWidth=8 → column 5
    const pos = layout.hitTest(40, 0)
    expect(pos.column).toBe(5)
  })

  it('should clamp to last line when clicking below document', () => {
    const layout = createLayout(['a', 'b'])
    const pos = layout.hitTest(0, 1000)
    expect(pos.line).toBe(1)
  })

  it('should clamp to line end when clicking past end of line', () => {
    const layout = createLayout(['hi'], 8, 20)
    // x=800 on a 2-char line → clamp to column 2
    const pos = layout.hitTest(800, 0)
    expect(pos.column).toBe(2)
  })

  it('should handle wrapped lines', () => {
    // 15 chars, 80px width, 8px charWidth → wraps at 10 chars
    const layout = createLayout(['abcdefghijklmno'], 8, 20)
    // Force max width for wrapping
    layout.setMaxWidth(80)

    // Click on second sub-line (y=20, within first line's second sub-line)
    const pos = layout.hitTest(16, 20) // x=16 → 2 chars into second sub-line
    expect(pos.line).toBe(0)
    expect(pos.column).toBe(12) // startColumn(10) + 2
  })
})
