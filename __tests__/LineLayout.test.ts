import { describe, it, expect } from 'vitest'
import { LineLayout, type TextMeasurer } from '../src/layout/LineLayout.js'

function createLayout(lines: string[], maxWidth = 800, charWidth = 8, lineHeight = 20) {
  const measurer: TextMeasurer = {
    measureWidth: (text) => text.length * charWidth,
    charWidth,
  }
  return new LineLayout(
    (i) => lines[i] ?? '',
    () => lines.length,
    measurer,
    lineHeight,
    maxWidth,
  )
}

describe('LineLayout', () => {
  it('should measure a single-line with correct height', () => {
    const layout = createLayout(['hello world'])
    const m = layout.measureLine(0)
    expect(m.height).toBe(20)
    expect(m.subLines).toHaveLength(1)
    expect(m.subLines[0].text).toBe('hello world')
    expect(m.subLines[0].startColumn).toBe(0)
    expect(m.subLines[0].endColumn).toBe(11)
  })

  it('should wrap long lines', () => {
    // charWidth=8, maxWidth=80 → 10 chars per line
    const text = 'abcdefghijklmno' // 15 chars
    const layout = createLayout([text], 80, 8, 20)
    const m = layout.measureLine(0)
    expect(m.subLines).toHaveLength(2)
    expect(m.height).toBe(40) // 2 sub-lines * 20px
    expect(m.subLines[0].text).toBe('abcdefghij')
    expect(m.subLines[1].text).toBe('klmno')
  })

  it('should compute total height', () => {
    const layout = createLayout(['a', 'b', 'c'], 800, 8, 20)
    expect(layout.getTotalHeight()).toBe(60)
  })

  it('should handle empty lines', () => {
    const layout = createLayout([''])
    const m = layout.measureLine(0)
    expect(m.height).toBe(20)
    expect(m.subLines).toHaveLength(1)
    expect(m.subLines[0].text).toBe('')
  })

  it('should return visible range', () => {
    const lines = Array.from({ length: 100 }, (_, i) => `line ${i}`)
    const layout = createLayout(lines, 800, 8, 20)
    const range = layout.getVisibleRange(0, 100)
    expect(range.start).toBe(0)
    expect(range.end).toBe(6) // 100px / 20px = 5 lines + 1 for partial
  })

  it('should return visible range for scrolled position', () => {
    const lines = Array.from({ length: 100 }, (_, i) => `line ${i}`)
    const layout = createLayout(lines, 800, 8, 20)
    const range = layout.getVisibleRange(200, 100)
    expect(range.start).toBe(10) // 200/20 = 10
    expect(range.end).toBe(16) // (200+100)/20 = 15 + 1 for partial
  })

  it('should invalidate and re-measure', () => {
    const lines = ['short', 'medium text']
    const layout = createLayout(lines, 800, 8, 20)
    layout.measureLine(0)
    layout.measureLine(1)

    lines[0] = 'this is now a much longer line'
    layout.invalidate(0, 1)

    const m = layout.measureLine(0)
    expect(m.subLines[0].text).toBe('this is now a much longer line')
  })

  it('should cache measurements', () => {
    const layout = createLayout(['hello'])
    const m1 = layout.measureLine(0)
    const m2 = layout.measureLine(0)
    expect(m1).toBe(m2) // Same object reference (cached)
  })
})
