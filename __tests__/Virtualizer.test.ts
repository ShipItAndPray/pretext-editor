import { describe, it, expect } from 'vitest'
import { LineLayout, type TextMeasurer } from '../src/layout/LineLayout.js'
import { Virtualizer } from '../src/layout/Virtualizer.js'

function createVirtualizer(lineCount: number, lineHeight = 20, overscan = 5) {
  const lines = Array.from({ length: lineCount }, (_, i) => `line ${i}`)
  const measurer: TextMeasurer = {
    measureWidth: (text) => text.length * 8,
    charWidth: 8,
  }
  const layout = new LineLayout(
    (i) => lines[i] ?? '',
    () => lines.length,
    measurer,
    lineHeight,
    800,
  )
  const virtualizer = new Virtualizer(layout, () => lines.length, overscan)
  return { virtualizer, layout }
}

describe('Virtualizer', () => {
  it('should include overscan lines', () => {
    const { virtualizer } = createVirtualizer(100, 20, 5)
    const range = virtualizer.getVisibleRange(200, 100)
    // Visible: lines 10-14, with overscan: 5-19
    expect(range.start).toBe(5)
    expect(range.end).toBe(21)
  })

  it('should clamp overscan to document bounds', () => {
    const { virtualizer } = createVirtualizer(10, 20, 5)
    const range = virtualizer.getVisibleRange(0, 100)
    expect(range.start).toBe(0)
    expect(range.end).toBe(10)
  })

  it('should return total height', () => {
    const { virtualizer } = createVirtualizer(50, 20)
    expect(virtualizer.getTotalHeight()).toBe(1000)
  })

  it('should detect when line is above viewport (ensureVisible)', () => {
    const { virtualizer } = createVirtualizer(100, 20)
    // scrollTop=200 means we see from line 10. Line 5 is above.
    const newScroll = virtualizer.ensureVisible(5, 200, 100)
    expect(newScroll).toBe(100) // line 5 top = 5*20 = 100
  })

  it('should detect when line is below viewport (ensureVisible)', () => {
    const { virtualizer } = createVirtualizer(100, 20)
    // scrollTop=0, viewport=100 means we see lines 0-4. Line 10 is below.
    const newScroll = virtualizer.ensureVisible(10, 0, 100)
    // line 10 bottom = 10*20+20 = 220, so scrollTop = 220 - 100 = 120
    expect(newScroll).toBe(120)
  })

  it('should return null when line is already visible', () => {
    const { virtualizer } = createVirtualizer(100, 20)
    const newScroll = virtualizer.ensureVisible(2, 0, 100)
    expect(newScroll).toBeNull()
  })

  it('should handle large document (1M lines)', () => {
    const { virtualizer } = createVirtualizer(1_000_000, 20, 5)
    const range = virtualizer.getVisibleRange(10_000_000, 800)
    // At scrollTop 10M, line ~500000
    expect(range.start).toBeGreaterThan(0)
    expect(range.end - range.start).toBeLessThan(60)
    expect(virtualizer.getTotalHeight()).toBe(20_000_000)
  })
})
