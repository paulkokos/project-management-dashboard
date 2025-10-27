import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '@/hooks'

describe('useDebounce Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500))
    expect(result.current).toBe('initial')
  })

  it('should debounce value updates with default delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'first' } }
    )

    expect(result.current).toBe('first')

    rerender({ value: 'second' })
    expect(result.current).toBe('first')

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current).toBe('second')
  })

  it('should debounce with custom delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 1000),
      { initialProps: { value: 'first' } }
    )

    rerender({ value: 'second' })

    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(result.current).toBe('first')

    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(result.current).toBe('second')
  })

  it('should reset timer on rapid value changes', () => {
    const { result, rerender, unmount } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    )

    rerender({ value: 'second' })
    act(() => {
      vi.advanceTimersByTime(250)
    })

    rerender({ value: 'third' })
    act(() => {
      vi.advanceTimersByTime(250)
    })

    expect(result.current).toBe('initial')

    act(() => {
      vi.advanceTimersByTime(250)
    })

    expect(result.current).toBe('third')
    unmount()
  })

  it('should handle multiple rapid updates', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'v1' } }
    )

    rerender({ value: 'v2' })
    act(() => {
      vi.advanceTimersByTime(100)
    })

    rerender({ value: 'v3' })
    act(() => {
      vi.advanceTimersByTime(100)
    })

    rerender({ value: 'v4' })
    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current).toBe('v4')
  })

  it('should work with numeric values', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 0 } }
    )

    expect(result.current).toBe(0)

    rerender({ value: 42 })
    expect(result.current).toBe(0)

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current).toBe(42)
  })

  it('should work with object values', () => {
    const obj1 = { id: 1, name: 'test' }
    const obj2 = { id: 2, name: 'test2' }

    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: obj1 } }
    )

    expect(result.current).toBe(obj1)

    rerender({ value: obj2 })
    expect(result.current).toBe(obj1)

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current).toBe(obj2)
  })

  it('should cleanup timeout on unmount', () => {
    const { rerender, unmount } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    )

    rerender({ value: 'updated' })

    unmount()

    act(() => {
      vi.advanceTimersByTime(500)
    })

    // No errors should occur
  })

  it('should handle zero delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 0),
      { initialProps: { value: 'first' } }
    )

    rerender({ value: 'second' })

    act(() => {
      vi.advanceTimersByTime(0)
    })

    expect(result.current).toBe('second')
  })

  it('should work with empty string values', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    )

    rerender({ value: '' })
    expect(result.current).toBe('initial')

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current).toBe('')
  })
})
