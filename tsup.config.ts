import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    target: 'es2020',
    bundle: true,
    splitting: false,
    minify: false,
    external: ['react', 'react-dom'],
  },
  {
    entry: { react: 'src/EditorReact.tsx' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    target: 'es2020',
    bundle: true,
    splitting: false,
    minify: false,
    external: ['react', 'react-dom', '@chenglou/pretext'],
  },
])
