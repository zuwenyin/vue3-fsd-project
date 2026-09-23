import { describe, expect, it } from 'vitest'
import { generatePrimaryShades, mix } from '../shades'
import { hexToRgb, isValidHex, rgbToHex } from '../convert'

describe('color/convert', () => {
  it('isValidHex 支持 #RGB 与 #RRGGBB', () => {
    expect(isValidHex('#fff')).toBe(true)
    expect(isValidHex('#FFFFFF')).toBe(true)
    expect(isValidHex('#409EFF')).toBe(true)
    expect(isValidHex('409EFF')).toBe(false)
    expect(isValidHex('#ggg')).toBe(false)
    expect(isValidHex('#ffff')).toBe(false)
  })

  it('hexToRgb 展开 #RGB 缩写', () => {
    expect(hexToRgb('#fff')).toEqual([255, 255, 255])
    expect(hexToRgb('#f00')).toEqual([255, 0, 0])
    expect(hexToRgb('#409EFF')).toEqual([64, 158, 255])
  })

  it('hexToRgb 对非法输入抛错', () => {
    expect(() => hexToRgb('#xyz')).toThrowError(/非法十六进制色值/)
    expect(() => hexToRgb('red')).toThrowError()
  })

  it('rgbToHex 输出小写 #RRGGBB 并裁剪越界通道', () => {
    expect(rgbToHex([64, 158, 255])).toBe('#409eff')
    expect(rgbToHex([0, 0, 0])).toBe('#000000')
    expect(rgbToHex([300, -20, 127.6])).toBe('#ff0080')
  })
})

describe('color/shades', () => {
  it('mix 与 SCSS mix() 等价（weight 为 color1 占比）', () => {
    expect(mix('#ffffff', '#000000', 0.5)).toBe('#808080')
    expect(mix('#ffffff', '#000000', 0)).toBe('#000000')
    expect(mix('#ffffff', '#000000', 1)).toBe('#ffffff')
  })

  it('mix 对越界 weight 做裁剪', () => {
    expect(mix('#ffffff', '#000000', -1)).toBe('#000000')
    expect(mix('#ffffff', '#000000', 2)).toBe('#ffffff')
  })

  it('generatePrimaryShades 生成 EP 色阶（#409EFF）', () => {
    expect(generatePrimaryShades('#409EFF')).toEqual({
      'light-3': '#79bbff',
      'light-5': '#a0cfff',
      'light-7': '#c6e2ff',
      'light-8': '#d9ecff',
      'light-9': '#ecf5ff',
      'dark-2': '#337ecc',
    })
  })

  it('generatePrimaryShades 支持 #RGB 缩写输入', () => {
    expect(generatePrimaryShades('#000')['light-9']).toBe('#e6e6e6')
    expect(generatePrimaryShades('#000')['dark-2']).toBe('#000000')
  })

  it('generatePrimaryShades 边界：纯白', () => {
    const shades = generatePrimaryShades('#ffffff')
    expect(shades['light-9']).toBe('#ffffff')
    expect(shades['light-3']).toBe('#ffffff')
    expect(shades['dark-2']).toBe('#cccccc')
  })

  it('generatePrimaryShades 边界：纯黑', () => {
    const shades = generatePrimaryShades('#000000')
    expect(shades['light-3']).toBe('#4d4d4d')
    expect(shades['dark-2']).toBe('#000000')
  })

  it('generatePrimaryShades 中间色（中间灰）', () => {
    const shades = generatePrimaryShades('#808080')
    expect(shades['light-5']).toBe('#c0c0c0')
    expect(shades['dark-2']).toBe('#666666')
  })
})
