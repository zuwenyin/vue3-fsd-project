import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { stubElementPlusStyles } from '../../vitest.element-plus-style-stub'

export default defineConfig({
  // @repo/ui 组件内置了 EP 按需样式导入（docs/05），单测里替换为空模块
  plugins: [vue(), stubElementPlusStyles()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    // mocks/ 下放 MSW handlers 的契约测试（docs/06 §9）
    include: ['src/**/*.spec.ts', 'mocks/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,vue}'],
      // 阈值落库（docs/06 §8）：其余包 ≥ 40%（P8 实测 lines ~46%；组件测试已补 P8 一轮）
      thresholds: { lines: 40, statements: 40 },
    },
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
