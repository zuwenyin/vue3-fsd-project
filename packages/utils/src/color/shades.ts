import { hexToRgb, rgbToHex } from './convert'

export type ShadeKey = 'light-3' | 'light-5' | 'light-7' | 'light-8' | 'light-9' | 'dark-2'

/**
 * 与 SCSS mix() 等价：weight 为 color1 的占比（0~1）。
 * mix('#ffffff', base, 0.9) → 90% 白 + 10% base（即 light-9）
 */
export function mix(color1: string, color2: string, weight: number): string {
  const w = Math.min(1, Math.max(0, weight))
  const [r1, g1, b1] = hexToRgb(color1)
  const [r2, g2, b2] = hexToRgb(color2)
  return rgbToHex([r1 * w + r2 * (1 - w), g1 * w + g2 * (1 - w), b1 * w + b2 * (1 - w)])
}

/** light-N = mix('#ffffff', base, N/10)；dark-2 = mix('#000000', base, 0.2) */
const SHADE_RULES: ReadonlyArray<{ key: ShadeKey; target: string; weight: number }> = [
  { key: 'light-3', target: '#ffffff', weight: 0.3 },
  { key: 'light-5', target: '#ffffff', weight: 0.5 },
  { key: 'light-7', target: '#ffffff', weight: 0.7 },
  { key: 'light-8', target: '#ffffff', weight: 0.8 },
  { key: 'light-9', target: '#ffffff', weight: 0.9 },
  { key: 'dark-2', target: '#000000', weight: 0.2 },
]

export function generatePrimaryShades(primary: string): Record<ShadeKey, string> {
  const result = {} as Record<ShadeKey, string>
  for (const rule of SHADE_RULES) {
    result[rule.key] = mix(rule.target, primary, rule.weight)
  }
  return result
}
