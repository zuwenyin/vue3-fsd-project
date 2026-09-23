const DATE_PATTERN = /YYYY|MM|DD|HH|mm|ss/g

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/** 支持 Date / 时间戳 / ISO 字符串；非法输入返回空串 */
export function formatDate(date: Date | string | number, pattern = 'YYYY-MM-DD HH:mm:ss'): string {
  const parsed = date instanceof Date ? date : new Date(date)
  const time = parsed.getTime()
  if (Number.isNaN(time)) return ''

  const map: Record<string, string> = {
    YYYY: String(parsed.getFullYear()),
    MM: pad(parsed.getMonth() + 1),
    DD: pad(parsed.getDate()),
    HH: pad(parsed.getHours()),
    mm: pad(parsed.getMinutes()),
    ss: pad(parsed.getSeconds()),
  }
  return pattern.replace(DATE_PATTERN, (token) => map[token] ?? token)
}

export function formatMoney(
  value: number,
  options: { currency?: string; precision?: number } = {},
): string {
  const { currency = '', precision = 2 } = options
  if (!Number.isFinite(value)) return ''
  const fixed = Math.abs(value).toFixed(precision)
  const [intPart = '0', decimalPart] = fixed.split('.')
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const sign = value < 0 ? '-' : ''
  return `${sign}${currency}${grouped}${decimalPart ? `.${decimalPart}` : ''}`
}

/** 手机号脱敏：138****8888 */
export function maskPhone(phone: string): string {
  if (typeof phone !== 'string') return ''
  const trimmed = phone.trim()
  if (trimmed.length < 7) return trimmed
  return `${trimmed.slice(0, 3)}****${trimmed.slice(-4)}`
}

export function formatBytes(bytes: number, precision = 2): string {
  if (!Number.isFinite(bytes)) return ''
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const exponent = Math.min(
    Math.floor(Math.log(Math.abs(bytes)) / Math.log(1024)),
    units.length - 1,
  )
  const value = bytes / 1024 ** exponent
  return `${value.toFixed(exponent === 0 ? 0 : precision)} ${units[exponent]}`
}
