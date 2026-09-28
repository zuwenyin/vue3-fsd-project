import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      // 阈值落库（docs/06 §8）：utils 是正确性关键（主题色阶 / 路由树 / storage），要求 ≥ 90%
      thresholds: {
        lines: 90,
        statements: 90,
        functions: 90,
      },
    },
  },
})
