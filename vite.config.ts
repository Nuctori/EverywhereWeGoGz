import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const appBase = process.env.APP_BASE?.trim()
const base = appBase ? `/${appBase.replace(/^\/+|\/+$/g, '')}/` : '/'

// https://vite.dev/config/
export default defineConfig(async () => {
  const plugins = [react()];

  if (process.env.ENABLE_REACT_INSPECT === '1') {
    try {
      const { inspectAttr } = await import('kimi-plugin-inspect-react');
      const inspectPlugins = inspectAttr();
      plugins.unshift(...(Array.isArray(inspectPlugins) ? inspectPlugins : [inspectPlugins]));
    } catch (error) {
      console.warn('[vite] kimi-plugin-inspect-react unavailable, continuing without it:', error);
    }
  }

  return {
    base,
    plugins,
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
  };
});
