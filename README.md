# @shipitandpray/pretext-editor

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://shipitandpray.github.io/pretext-editor/) [![GitHub](https://img.shields.io/github/stars/ShipItAndPray/pretext-editor?style=social)](https://github.com/ShipItAndPray/pretext-editor)

> **[View Live Demo](https://shipitandpray.github.io/pretext-editor/)**

Canvas text editor powered by [Pretext](https://github.com/chenglou/pretext) — no `contenteditable`, no DOM text nodes, handles millions of lines.

## Why

Every web text editor (Monaco, CodeMirror, Ace) uses DOM nodes for text rendering:

- Layout reflow on every keystroke
- Sluggish with 100K+ lines
- `contenteditable` is a nightmare of browser inconsistencies

This editor renders **entirely on Canvas** using Pretext for sub-pixel-accurate layout. A hidden `<textarea>` captures keyboard/IME input (the same technique Monaco uses). The result: constant-time scroll, no reflow, and a clean architecture.

## Install

```bash
npm install @shipitandpray/pretext-editor @chenglou/pretext
```

## Usage (Vanilla)

```ts
import { Editor } from '@shipitandpray/pretext-editor'

const container = document.getElementById('editor')!
const editor = new Editor(container, { width: 800, height: 600 })
editor.setValue('Hello, world!\nLine 2')
editor.setOnChange((value) => console.log('Changed:', value))
```

## Usage (React)

```tsx
import { PretextEditor } from '@shipitandpray/pretext-editor/react'

function App() {
  const [code, setCode] = useState('// type here...')
  return (
    <PretextEditor
      value={code}
      onChange={setCode}
      width={800}
      height={600}
    />
  )
}
```

## Theme Customization

Pass a partial theme to override colors:

```ts
const editor = new Editor(container, {
  width: 800,
  height: 600,
  theme: {
    background: '#282c34',
    foreground: '#abb2bf',
    cursor: '#528bff',
    selection: 'rgba(82, 139, 255, 0.3)',
    lineNumber: '#636d83',
    gutterBackground: '#282c34',
    currentLine: 'rgba(255, 255, 255, 0.03)',
  },
})
```

### Default Theme (Dark)

| Property           | Default                       |
| ------------------ | ----------------------------- |
| `background`       | `#1e1e1e`                     |
| `foreground`       | `#d4d4d4`                     |
| `selection`        | `rgba(38, 79, 120, 0.6)`     |
| `cursor`           | `#aeafad`                     |
| `lineNumber`       | `#858585`                     |
| `gutterBackground` | `#1e1e1e`                     |
| `currentLine`      | `rgba(255, 255, 255, 0.04)`  |

## Options

| Option        | Type      | Default | Description                     |
| ------------- | --------- | ------- | ------------------------------- |
| `width`       | `number`  | —       | Canvas width in pixels          |
| `height`      | `number`  | —       | Canvas height in pixels         |
| `font`        | `string`  | `14px "JetBrains Mono", ...`  | CSS font string    |
| `lineHeight`  | `number`  | `20`    | Line height in pixels           |
| `readOnly`    | `boolean` | `false` | Disable editing                 |
| `wordWrap`    | `boolean` | `false` | Enable soft word wrap           |
| `lineNumbers` | `boolean` | `true`  | Show line number gutter         |
| `theme`       | `object`  | Dark    | Partial theme overrides         |

## Performance

| Metric                    | Target       |
| ------------------------- | ------------ |
| Keystroke to render       | < 2ms        |
| Scroll FPS (1M lines)     | 120fps       |
| Initial load (100K lines) | < 200ms      |
| Memory (1M lines)         | < 100MB      |
| Cache hit rate             | > 99%        |

The virtualizer only measures and renders visible lines plus a small overscan buffer. Line measurements are cached and only invalidated on edit. Cumulative heights use binary search for O(log n) scroll-to-line mapping.

## Architecture

```
Canvas (rendering)  <--  Virtualizer (visible range)  <--  LineLayout (Pretext measurement)
     ^                                                           ^
     |                                                           |
Hidden <textarea>  -->  KeyboardHandler  -->  Document (line model + undo/redo)
Mouse events       -->  MouseHandler     -->  Cursor (position + selection)
```

- **Document**: Array of lines, insert/delete with full undo/redo stack
- **LineLayout**: Pretext-based line measurement, wrapping, cumulative heights
- **Virtualizer**: Determines visible range with overscan, ensures cursor visibility
- **CanvasRenderer**: Draws text, gutter, selections, cursor via Canvas 2D
- **KeyboardHandler**: Hidden textarea for input capture (handles IME, autocorrect)
- **MouseHandler**: Click-to-position, drag-to-select via hitTest

## License

MIT
