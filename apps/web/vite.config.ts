import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    // 别名必须与 tsconfig.json 的 paths 保持一致
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
  build: {
    target: 'es2022',
    // Vite 8 已移除 manualChunks 的对象形式（只接受函数）：按 docs/12 §6 回退，交给默认分包
  },
})
