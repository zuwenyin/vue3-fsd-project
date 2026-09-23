const HEX_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

/** 支持 #RGB / #RRGGBB */
export function isValidHex(hex: string): boolean {
  return isStringLike(hex) && HEX_PATTERN.test(hex.trim())
}

function isStringLike(value: unknown): value is string {
  return typeof value === 'string'
}

function normalizeHex(hex: string): string {
  const trimmed = hex.trim()
  if (!HEX_PATTERN.test(trimmed)) {
    throw new Error(`[utils/color] 非法十六进制色值: ${hex}`)
  }
  const body = trimmed.slice(1)
  if (body.length === 3) {
    return body
      .split('')
      .map((char) => char + char)
      .join('')
  }
  return body
}

export function hexToRgb(hex: string): [number, number, number] {
  const body = normalizeHex(hex)
  const r = Number.parseInt(body.slice(0, 2), 16)
  const g = Number.parseInt(body.slice(2, 4), 16)
  const b = Number.parseInt(body.slice(4, 6), 16)
  return [r, g, b]
}

function clampChannel(value: number): number {
  if (Number.isNaN(value)) return 0
  return Math.min(255, Math.max(0, Math.round(value)))
}

function toHexPart(value: number): string {
  return clampChannel(value).toString(16).padStart(2, '0')
}

export function rgbToHex(rgb: [number, number, number]): string {
  return `#${toHexPart(rgb[0])}${toHexPart(rgb[1])}${toHexPart(rgb[2])}`
}
