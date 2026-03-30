/** A position in the document (zero-based line and column). */
export interface Position {
  line: number
  column: number
}

/** A range between two positions. */
export interface Range {
  start: Position
  end: Position
}

/** Result of measuring a single document line (may wrap into multiple sub-lines). */
export interface LineMeasurement {
  /** Total pixel height including all wrapped sub-lines. */
  height: number
  /** Individual wrapped sub-lines. */
  subLines: SubLine[]
}

/** A single visual sub-line produced by word-wrapping. */
export interface SubLine {
  text: string
  width: number
  startColumn: number
  endColumn: number
}

/** Theme colors for the editor. */
export interface EditorTheme {
  background: string
  foreground: string
  selection: string
  cursor: string
  lineNumber: string
  gutterBackground: string
  currentLine: string
}

/** Options controlling how the editor renders. */
export interface RenderOptions {
  font: string
  lineHeight: number
  gutterWidth: number
  padding: { top: number; left: number }
  theme: EditorTheme
}

/** Full snapshot of editor state passed to renderers. */
export interface EditorState {
  doc: {
    getLine(index: number): string
    getLineCount(): number
  }
  cursor: Position
  selection: Range | null
  scrollTop: number
  scrollLeft: number
  viewportWidth: number
  viewportHeight: number
  focused: boolean
}

/** Default dark theme. */
export const DEFAULT_THEME: EditorTheme = {
  background: '#1e1e1e',
  foreground: '#d4d4d4',
  selection: 'rgba(38, 79, 120, 0.6)',
  cursor: '#aeafad',
  lineNumber: '#858585',
  gutterBackground: '#1e1e1e',
  currentLine: 'rgba(255, 255, 255, 0.04)',
}

/** Default render options. */
export const DEFAULT_RENDER_OPTIONS: RenderOptions = {
  font: '14px "JetBrains Mono", "Fira Code", "Cascadia Code", Menlo, Consolas, monospace',
  lineHeight: 20,
  gutterWidth: 60,
  padding: { top: 4, left: 8 },
  theme: DEFAULT_THEME,
}
