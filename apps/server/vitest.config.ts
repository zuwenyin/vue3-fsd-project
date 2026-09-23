import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.spec.ts'],
    env: {
      DB_PATH: ':memory:',
      NODE_ENV: 'test',
      SEED: 'true',
      JWT_SECRET: 'test-secret',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/scripts/**', 'src/index.ts'],
    },
  },
})
