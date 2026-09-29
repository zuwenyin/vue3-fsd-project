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
      // 阈值落库（docs/06 §8）：P12 由 40 提到 60（留余量防回退）
      // 实测：P8 61.06% → P10 补测 66.93% → P11 68.81% → P12 组件测试补齐后 ≥ 72%
      thresholds: { lines: 60, statements: 60 },
    },
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
