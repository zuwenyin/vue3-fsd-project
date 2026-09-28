import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { stubElementPlusStyles } from '../../vitest.element-plus-style-stub'

export default defineConfig({
  // 组件内按 docs/05 显式 import 了 EP 按需样式（`*/style/css`），单测里替换为空模块
  plugins: [vue(), stubElementPlusStyles()],
  test: {
    environment: 'happy-dom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,vue}'],
      // 阈值落库（docs/06 §8）：其余包 ≥ 40%（当前实测 ~86%，留提升空间）
      thresholds: { lines: 40, statements: 40 },
    },
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
