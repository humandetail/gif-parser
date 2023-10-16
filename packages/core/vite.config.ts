import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig(({ mode }) => {
  return {
    plugins: [
      dts({
        copyDtsFiles: true
      })
    ],
    build: {
      lib: {
        entry: './index.ts',
        name: 'GIFParser',
        fileName: 'gif-parser',
        formats: ['es', 'iife']
      },
      sourcemap: mode !== 'production'
    }
  }
})
