import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from '@/hooks'

describe('useLocalStorage Hook', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('should return initial value when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('test', 'initial'))

    expect(result.current[0]).toBe('initial')
  })

  it('should retrieve value from localStorage on mount', () => {
    localStorage.setItem('test', JSON.stringify('stored'))
    const { result } = renderHook(() => useLocalStorage('test', 'initial'))

    expect(result.current[0]).toBe('stored')
  })

  it('should store value to localStorage when setter is called', () => {
    const { result } = renderHook(() => useLocalStorage('test', 'initial'))

    act(() => {
      result.current[1]('updated')
    })

    expect(result.current[0]).toBe('updated')
    expect(localStorage.getItem('test')).toBe(JSON.stringify('updated'))
  })

  it('should handle function-style updates', () => {
    const { result } = renderHook(() => useLocalStorage('counter', 0))

    act(() => {
      result.current[1]((prev: number) => prev + 1)
    })

    expect(result.current[0]).toBe(1)
    expect(localStorage.getItem('counter')).toBe('1')
  })

  it('should work with object values', () => {
    const initialObj = { name: 'test', count: 0 }
    const { result } = renderHook(() => useLocalStorage('obj', initialObj))

    expect(result.current[0]).toEqual(initialObj)

    const updatedObj = { name: 'updated', count: 1 }
    act(() => {
      result.current[1](updatedObj)
    })

    expect(result.current[0]).toEqual(updatedObj)
    expect(JSON.parse(localStorage.getItem('obj')!)).toEqual(updatedObj)
  })

  it('should work with array values', () => {
    const initialArray = [1, 2, 3]
    const { result } = renderHook(() => useLocalStorage('arr', initialArray))

    expect(result.current[0]).toEqual(initialArray)

    const updatedArray = [1, 2, 3, 4]
    act(() => {
      result.current[1](updatedArray)
    })

    expect(result.current[0]).toEqual(updatedArray)
    expect(JSON.parse(localStorage.getItem('arr')!)).toEqual(updatedArray)
  })

  it('should handle null values', () => {
    const { result } = renderHook(() => useLocalStorage<string | null>('nullable', null))

    expect(result.current[0]).toBe(null)

    act(() => {
      result.current[1]('not null')
    })

    expect(result.current[0]).toBe('not null')
  })

  it('should handle boolean values', () => {
    const { result } = renderHook(() => useLocalStorage('bool', true))

    expect(result.current[0]).toBe(true)

    act(() => {
      result.current[1](false)
    })

    expect(result.current[0]).toBe(false)
    expect(localStorage.getItem('bool')).toBe('false')
  })

  it('should handle multiple hooks with different keys', () => {
    const { result: result1 } = renderHook(() => useLocalStorage('key1', 'value1'))
    const { result: result2 } = renderHook(() => useLocalStorage('key2', 'value2'))

    expect(result1.current[0]).toBe('value1')
    expect(result2.current[0]).toBe('value2')

    act(() => {
      result1.current[1]('updated1')
    })

    expect(result1.current[0]).toBe('updated1')
    expect(result2.current[0]).toBe('value2')
  })

  it('should handle updates multiple times', () => {
    const { result } = renderHook(() => useLocalStorage('counter', 0))

    act(() => {
      result.current[1]((prev: number) => prev + 1)
    })
    expect(result.current[0]).toBe(1)

    act(() => {
      result.current[1]((prev: number) => prev + 1)
    })
    expect(result.current[0]).toBe(2)

    act(() => {
      result.current[1]((prev: number) => prev + 1)
    })
    expect(result.current[0]).toBe(3)

    expect(localStorage.getItem('counter')).toBe('3')
  })

  it('should return initial value if JSON parsing fails', () => {
    localStorage.setItem('invalid', 'not valid json')
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { result } = renderHook(() => useLocalStorage('invalid', 'default'))

    expect(result.current[0]).toBe('default')
    consoleSpy.mockRestore()
  })

  it('should handle complex nested objects', () => {
    const complexObj = {
      user: {
        name: 'John',
        age: 30,
        address: {
          street: '123 Main St',
          city: 'NYC',
        },
      },
      tags: ['tag1', 'tag2'],
    }

    const { result } = renderHook(() =>
      useLocalStorage('complex', complexObj)
    )

    expect(result.current[0]).toEqual(complexObj)

    act(() => {
      result.current[1]({
        ...complexObj,
        user: { ...complexObj.user, age: 31 },
      })
    })

    expect(result.current[0].user.age).toBe(31)
    expect(JSON.parse(localStorage.getItem('complex')!).user.age).toBe(31)
  })

  it('should handle undefined values', () => {
    const { result } = renderHook(() => useLocalStorage('undef', undefined as any))

    expect(result.current[0]).toBe(undefined)
  })
})
