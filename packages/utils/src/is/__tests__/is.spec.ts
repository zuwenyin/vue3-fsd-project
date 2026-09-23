import { describe, expect, it } from 'vitest'
import { isArray, isDef, isEmpty, isFunction, isNumber, isObject, isString, isUndef } from '..'

describe('is', () => {
  it('isDef / isUndef', () => {
    expect(isDef(0)).toBe(true)
    expect(isDef('')).toBe(true)
    expect(isDef(null)).toBe(false)
    expect(isDef(undefined)).toBe(false)
    expect(isUndef(null)).toBe(true)
    expect(isUndef(undefined)).toBe(true)
    expect(isUndef(0)).toBe(false)
  })

  it('isObject 排除数组与 null', () => {
    expect(isObject({})).toBe(true)
    expect(isObject([])).toBe(false)
    expect(isObject(null)).toBe(false)
    expect(isObject('x')).toBe(false)
  })

  it('isArray / isString / isNumber / isFunction', () => {
    expect(isArray([])).toBe(true)
    expect(isArray({})).toBe(false)
    expect(isString('a')).toBe(true)
    expect(isNumber(1)).toBe(true)
    expect(isNumber(Number.NaN)).toBe(false)
    expect(isFunction(() => undefined)).toBe(true)
    expect(isFunction({})).toBe(false)
  })

  it('isEmpty 覆盖各类空值', () => {
    expect(isEmpty(null)).toBe(true)
    expect(isEmpty(undefined)).toBe(true)
    expect(isEmpty('')).toBe(true)
    expect(isEmpty('   ')).toBe(true)
    expect(isEmpty('a')).toBe(false)
    expect(isEmpty([])).toBe(true)
    expect(isEmpty([1])).toBe(false)
    expect(isEmpty({})).toBe(true)
    expect(isEmpty({ a: 1 })).toBe(false)
    expect(isEmpty(new Map())).toBe(true)
    expect(isEmpty(new Set([1]))).toBe(false)
    expect(isEmpty(0)).toBe(false)
    expect(isEmpty(false)).toBe(false)
  })
})
