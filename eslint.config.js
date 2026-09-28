import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import prettierConfig from 'eslint-config-prettier'

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/.changeset/**',
      '**/node_modules/**',
      // 生成的 MSW service worker（public 下均不 lint）
      '**/public/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { parser: tseslint.parser },
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
    },
  },
  {
    files: ['**/*.vue'],
    rules: {
      'vue/component-api-style': ['error', ['script-setup']],
      // 可选 props 由 TS 类型与 withDefaults 表达，强制补 undefined 默认值无意义
      'vue/require-default-prop': 'off',
    },
  },
  {
    // 测试文件：Vitest 全局变量
    files: ['**/*.{spec,test}.{ts,js}', '**/vitest.setup.ts'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        vi: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
  },
  // ---- FSD 分层导入约束（docs/06 §4 / docs/10 §1.5）----
  // 注意：no-restricted-imports 在同一个 files 分组内只能声明一次
  {
    files: ['apps/web/src/shared/**/*.{ts,vue}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: ['@/entities/*', '@/features/*', '@/widgets/*', '@/pages/*', '@/app/*'],
        },
      ],
    },
  },
  {
    files: ['apps/web/src/entities/**/*.{ts,vue}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: ['@/features/*', '@/widgets/*', '@/pages/*'],
        },
      ],
    },
  },
  {
    // Public API 约束：禁止穿透到 slice 内部
    files: ['apps/web/src/**/*.{ts,vue}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*/model/*', '@/features/*/ui/*', '@/features/*/lib/*'],
              message: '请从 slice 的 index.ts 导入',
            },
            {
              group: ['@/entities/*/model/*', '@/entities/*/lib/*'],
              message: '请从 slice 的 index.ts 导入',
            },
          ],
        },
      ],
    },
  },
  {
    // server 覆盖：Node 侧允许 console
    files: ['apps/server/**/*.ts'],
    languageOptions: { globals: { ...globals.node } },
    rules: { 'no-console': 'off' },
  },
  prettierConfig,
)
