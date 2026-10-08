import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      entryRoot: 'src',
      tsconfigPath: './tsconfig.json',
      exclude: ['vite.config.ts', 'vitest.config.ts', '**/*.spec.ts', '**/__tests__/**'],
    }),
  ],
  build: {
    lib: {
      entry: fileURLToPath(new URL('src/index.ts', import.meta.url)),
      name: 'RepoUI',
      // 与 package.json 的 exports（./dist/index.mjs / ./dist/index.cjs）保持一致
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.mjs' : 'index.cjs'),
      // CSS 产物名对齐 exports 的 './styles.css' → './dist/style.css'
      // （Vite 默认按包名输出 ui.css，会让 exports 指向不存在的文件 —— P13 实测踩坑）
      cssFileName: 'style',
    },
    rollupOptions: {
      external: ['vue', 'element-plus', '@element-plus/icons-vue', /^element-plus\/.*/],
      output: {
        globals: {
          vue: 'Vue',
          'element-plus': 'ElementPlus',
          '@element-plus/icons-vue': 'ElementPlusIconsVue',
        },
      },
    },
    cssCodeSplit: false,
    sourcemap: true,
  },
})
