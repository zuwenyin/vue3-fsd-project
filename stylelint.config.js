export default {
  extends: ['stylelint-config-standard-scss', 'stylelint-config-recommended-vue'],
  plugins: ['stylelint-scss', 'stylelint-declaration-strict-value'],
  overrides: [
    { files: ['**/*.{css,scss}'], customSyntax: 'postcss-scss' },
    { files: ['**/*.vue'], customSyntax: 'postcss-html' },
  ],
  rules: {
    // ---- L2：SCSS 约束 ----
    // 类名采用 BEM：block[-modifier 词] / block__element / block--modifier
    // （config-standard 默认只允许 kebab-case，会拒绝 `fsd-table__pagination`）
    'selector-class-pattern': [
      '^[a-z][a-z0-9]*(-[a-z0-9]+)*(__[a-z0-9]+(-[a-z0-9]+)*)?(--[a-z0-9]+(-[a-z0-9]+)*)?$',
      { message: '类名需为 BEM：block / block__element / block--modifier（小写 kebab-case）' },
    ],
    'scss/at-rule-no-unknown': true,
    'scss/dollar-variable-pattern': '^[_a-z][a-z0-9-]*$',
    'scss/dollar-variable-no-missing-interpolation': true,
    'scss/selector-no-redundant-nesting-selector': true,
    'max-nesting-depth': 4,
    'no-invalid-position-at-import-rule': [true, { ignoreAtRules: ['use', 'forward'] }],

    // ---- 设计令牌强制（error）：颜色 / 层级 / 字号 / 间距 ----
    'scale-unlimited/declaration-strict-value': [
      [
        // 颜色
        '/color$/',
        '/^background/',
        '/^border-.*color$/',
        'fill',
        'stroke',
        // 层级
        'z-index',
        // 字号与行高
        'font-size',
        'line-height',
        // 间距
        '/^(margin|padding|gap)/',
      ],
      {
        ignoreValues: [
          'transparent',
          'currentColor',
          'inherit',
          'initial',
          'unset',
          'none',
          'auto',
          '0',
          '1px',
          '50%',
          '100%',
        ],
        disableFix: true,
        severity: 'error',
      },
    ],
  },
}
