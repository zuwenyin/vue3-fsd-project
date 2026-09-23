import { describe, expect, it } from 'vitest'
import { formatBytes, formatDate, formatMoney, maskPhone } from '..'

describe('format', () => {
  it('formatDate 默认格式', () => {
    const date = new Date(2026, 0, 2, 3, 4, 5)
    expect(formatDate(date)).toBe('2026-01-02 03:04:05')
  })

  it('formatDate 支持自定义 pattern 与时间戳 / ISO 字符串', () => {
    const date = new Date(2026, 0, 2, 3, 4, 5)
    expect(formatDate(date, 'YYYY/MM/DD')).toBe('2026/01/02')
    expect(formatDate(date.getTime(), 'YYYY-MM-DD')).toBe('2026-01-02')
    expect(formatDate(date.toISOString(), 'YYYY')).toBe(String(date.getFullYear()))
  })

  it('formatDate 非法输入返回空串', () => {
    expect(formatDate('not-a-date')).toBe('')
  })

  it('formatMoney 千分位与精度', () => {
    expect(formatMoney(1234567.891)).toBe('1,234,567.89')
    expect(formatMoney(1234)).toBe('1,234.00')
    expect(formatMoney(-1234, { precision: 0 })).toBe('-1,234')
    expect(formatMoney(88, { currency: '¥' })).toBe('¥88.00')
    expect(formatMoney(Number.NaN)).toBe('')
  })

  it('maskPhone 中间四位脱敏', () => {
    expect(maskPhone('13812348888')).toBe('138****8888')
    expect(maskPhone('123')).toBe('123')
    expect(maskPhone('')).toBe('')
  })

  it('formatBytes 单位换算', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1024)).toBe('1.00 KB')
    expect(formatBytes(1024 * 1024 * 3.5)).toBe('3.50 MB')
    expect(formatBytes(Number.NaN)).toBe('')
  })
})
