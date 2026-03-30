import { describe, it, expect } from 'vitest'
import { Document } from '../src/model/Document.js'

describe('Document', () => {
  it('should initialize with empty text', () => {
    const doc = new Document()
    expect(doc.getLineCount()).toBe(1)
    expect(doc.getLine(0)).toBe('')
    expect(doc.getText()).toBe('')
  })

  it('should initialize with provided text', () => {
    const doc = new Document('hello\nworld')
    expect(doc.getLineCount()).toBe(2)
    expect(doc.getLine(0)).toBe('hello')
    expect(doc.getLine(1)).toBe('world')
  })

  it('should insert text within a line', () => {
    const doc = new Document('hello world')
    const pos = doc.insert({ line: 0, column: 5 }, ' beautiful')
    expect(doc.getText()).toBe('hello beautiful world')
    expect(pos).toEqual({ line: 0, column: 15 })
  })

  it('should insert a newline', () => {
    const doc = new Document('hello world')
    const pos = doc.insert({ line: 0, column: 5 }, '\n')
    expect(doc.getLineCount()).toBe(2)
    expect(doc.getLine(0)).toBe('hello')
    expect(doc.getLine(1)).toBe(' world')
    expect(pos).toEqual({ line: 1, column: 0 })
  })

  it('should insert multi-line text', () => {
    const doc = new Document('AB')
    const pos = doc.insert({ line: 0, column: 1 }, 'x\ny\nz')
    expect(doc.getLineCount()).toBe(3)
    expect(doc.getLine(0)).toBe('Ax')
    expect(doc.getLine(1)).toBe('y')
    expect(doc.getLine(2)).toBe('zB')
    expect(pos).toEqual({ line: 2, column: 1 })
  })

  it('should delete within a line', () => {
    const doc = new Document('hello world')
    const pos = doc.delete({
      start: { line: 0, column: 5 },
      end: { line: 0, column: 11 },
    })
    expect(doc.getText()).toBe('hello')
    expect(pos).toEqual({ line: 0, column: 5 })
  })

  it('should delete across lines', () => {
    const doc = new Document('first\nsecond\nthird')
    doc.delete({
      start: { line: 0, column: 3 },
      end: { line: 2, column: 2 },
    })
    expect(doc.getText()).toBe('firird')
    expect(doc.getLineCount()).toBe(1)
  })

  it('should undo an insert', () => {
    const doc = new Document('hello')
    doc.insert({ line: 0, column: 5 }, ' world')
    expect(doc.getText()).toBe('hello world')
    doc.undo()
    expect(doc.getText()).toBe('hello')
  })

  it('should undo a delete', () => {
    const doc = new Document('hello world')
    doc.delete({
      start: { line: 0, column: 5 },
      end: { line: 0, column: 11 },
    })
    expect(doc.getText()).toBe('hello')
    doc.undo()
    expect(doc.getText()).toBe('hello world')
  })

  it('should redo after undo', () => {
    const doc = new Document('hello')
    doc.insert({ line: 0, column: 5 }, ' world')
    doc.undo()
    expect(doc.getText()).toBe('hello')
    doc.redo()
    expect(doc.getText()).toBe('hello world')
  })

  it('should clear redo stack on new edit after undo', () => {
    const doc = new Document('hello')
    doc.insert({ line: 0, column: 5 }, ' world')
    doc.undo()
    doc.insert({ line: 0, column: 5 }, '!')
    expect(doc.canRedo()).toBe(false)
  })

  it('should report canUndo/canRedo correctly', () => {
    const doc = new Document('a')
    expect(doc.canUndo()).toBe(false)
    expect(doc.canRedo()).toBe(false)
    doc.insert({ line: 0, column: 1 }, 'b')
    expect(doc.canUndo()).toBe(true)
    doc.undo()
    expect(doc.canRedo()).toBe(true)
  })

  it('should handle getTextInRange', () => {
    const doc = new Document('first\nsecond\nthird')
    expect(doc.getTextInRange({
      start: { line: 0, column: 3 },
      end: { line: 2, column: 2 },
    })).toBe('st\nsecond\nth')
  })

  it('should handle setText which clears history', () => {
    const doc = new Document('hello')
    doc.insert({ line: 0, column: 5 }, ' world')
    doc.setText('fresh')
    expect(doc.getText()).toBe('fresh')
    expect(doc.canUndo()).toBe(false)
  })
})
