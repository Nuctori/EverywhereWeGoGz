import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

const appBase = process.env.APP_BASE?.trim()
const base = appBase ? `/${appBase.replace(/^\/+|\/+$/g, '')}/` : '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [inspectAttr(), react()],
  define: {
    __DATA_VERSION__: JSON.stringify(
      process.env.GITHUB_SHA ?? process.env.GITHUB_RUN_ID ?? Date.now().toString(),
    ),
  },
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
