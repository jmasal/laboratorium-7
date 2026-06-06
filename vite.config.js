import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { readdirSync } from 'node:fs'
import tailwindcss from '@tailwindcss/vite'

const __dirname = dirname(fileURLToPath(import.meta.url))

function getHtmlInputs(dir) {
  const inputs = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = resolve(dir, entry.name)
    if (entry.isDirectory()) {
      inputs.push(...getHtmlInputs(fullPath))
    } else if (entry.name.endsWith('.html')) {
      inputs.push(fullPath)
    }
  }
  return inputs
}

const inputs = getHtmlInputs(resolve(__dirname, 'src'))

export default defineConfig({
  plugins: [tailwindcss()],
  root: resolve(__dirname, 'src'),
  build: {
    emptyOutDir: true,
    rollupOptions: {
      input: inputs,
    },
    outDir: resolve(__dirname, 'dist'),
  },
})