// Core editor
export { Editor, type EditorOptions } from './Editor.js'

// React wrapper (re-exported for convenience; also available via /react entry)
export { PretextEditor, type PretextEditorProps } from './EditorReact.js'

// Model
export { Document } from './model/Document.js'
export { Cursor } from './model/Cursor.js'

// Layout
export { LineLayout, type TextMeasurer } from './layout/LineLayout.js'
export { Virtualizer } from './layout/Virtualizer.js'
export { GutterLayout } from './layout/GutterLayout.js'

// Rendering
export { CanvasRenderer } from './render/CanvasRenderer.js'
export { SelectionRenderer } from './render/SelectionRenderer.js'
export { CursorRenderer } from './render/CursorRenderer.js'

// Input
export { KeyboardHandler } from './input/KeyboardHandler.js'
export { MouseHandler } from './input/MouseHandler.js'
export { ClipboardHandler } from './input/ClipboardHandler.js'

// Features
export { Search } from './features/Search.js'
export { LineNumbers } from './features/LineNumbers.js'
export { Wordwrap } from './features/Wordwrap.js'

// Types
export type {
  Position,
  Range,
  LineMeasurement,
  SubLine,
  EditorTheme,
  RenderOptions,
  EditorState,
} from './types.js'
export { DEFAULT_THEME, DEFAULT_RENDER_OPTIONS } from './types.js'
