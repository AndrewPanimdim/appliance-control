import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// On GitHub Pages the site lives at /<repo-name>/, so the deploy workflow
// sets BASE_PATH. Locally it falls back to '/'.
export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_PATH ?? '/',
})
