import type { Position, Range } from '../types.js'

export interface SearchMatch {
  range: Range
}

/**
 * Find/replace across the document.
 */
export class Search {
  private matches: SearchMatch[] = []
  private currentIndex = -1

  constructor(
    private getLine: (index: number) => string,
    private getLineCount: () => number,
  ) {}

  /**
   * Find all occurrences of `query` in the document.
   */
  findAll(query: string, caseSensitive = false): SearchMatch[] {
    this.matches = []
    if (!query) return this.matches

    const lineCount = this.getLineCount()
    const q = caseSensitive ? query : query.toLowerCase()

    for (let i = 0; i < lineCount; i++) {
      const line = caseSensitive ? this.getLine(i) : this.getLine(i).toLowerCase()
      let col = 0
      while (col < line.length) {
        const idx = line.indexOf(q, col)
        if (idx === -1) break
        this.matches.push({
          range: {
            start: { line: i, column: idx },
            end: { line: i, column: idx + query.length },
          },
        })
        col = idx + 1
      }
    }

    this.currentIndex = this.matches.length > 0 ? 0 : -1
    return this.matches
  }

  getMatches(): SearchMatch[] {
    return this.matches
  }

  getCurrentMatch(): SearchMatch | null {
    if (this.currentIndex < 0) return null
    return this.matches[this.currentIndex] ?? null
  }

  nextMatch(): SearchMatch | null {
    if (this.matches.length === 0) return null
    this.currentIndex = (this.currentIndex + 1) % this.matches.length
    return this.matches[this.currentIndex]
  }

  previousMatch(): SearchMatch | null {
    if (this.matches.length === 0) return null
    this.currentIndex = (this.currentIndex - 1 + this.matches.length) % this.matches.length
    return this.matches[this.currentIndex]
  }

  clear(): void {
    this.matches = []
    this.currentIndex = -1
  }

  /**
   * Find the nearest match to a given position.
   */
  findNearest(pos: Position): SearchMatch | null {
    if (this.matches.length === 0) return null
    for (let i = 0; i < this.matches.length; i++) {
      const m = this.matches[i]
      if (
        m.range.start.line > pos.line ||
        (m.range.start.line === pos.line && m.range.start.column >= pos.column)
      ) {
        this.currentIndex = i
        return m
      }
    }
    this.currentIndex = 0
    return this.matches[0]
  }
}
