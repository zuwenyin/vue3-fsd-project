/** 明暗模式（docs/04 §1）：auto 跟随系统 `prefers-color-scheme` */
export type ThemeMode = 'light' | 'dark' | 'auto'

/** 圆角档位（docs/04 §1 扩展位，P11 落地） */
export type RadiusLevel = 'none' | 'sm' | 'md' | 'lg'

/** 紧凑度档位：同时驱动间距令牌与 EP 组件 size（P11） */
export type DensityLevel = 'compact' | 'default' | 'comfortable'

/** 显示模式：正常 / 灰阶 / 色弱辅助（P11） */
export type ColorMode = 'none' | 'grayscale' | 'weak'

/** 持久化到 `fsd:theme` 的主题偏好（决策 D1，键见 shared/config/storage-keys.ts） */
export interface ThemePreference {
  mode: ThemeMode
  /** 品牌色（#RRGGBB，运行时生成色阶覆盖 EP 变量） */
  primary: string
  /** 圆角档位（写 `--fsd-radius-*` 与 `--el-border-radius-*`） */
  radius: RadiusLevel
  /** 紧凑度（缩放 `--fsd-space-*`；EP 尺寸由 `ElConfigProvider :size` 联动） */
  density: DensityLevel
  /** 灰阶 / 色弱（`html` class + 全局 filter） */
  colorMode: ColorMode
}
