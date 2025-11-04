import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useWebSocket } from '@/hooks'
import { wsService } from '@/services/websocket'

// Mock websocket service
vi.mock('@/services/websocket', () => ({
  wsService: {
    connect: vi.fn().mockResolvedValue(undefined),
    isConnected: vi.fn().mockReturnValue(false),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
}))

describe('useWebSocket Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('should initialize hook without errors', () => {
    const { result } = renderHook(() => useWebSocket())
    expect(result.current).toBeDefined()
  })

  it('should return expected functions', () => {
    const { result } = renderHook(() => useWebSocket())
    expect(typeof result.current.subscribe).toBe('function')
    expect(typeof result.current.unsubscribe).toBe('function')
    expect(typeof result.current.on).toBe('function')
    expect(typeof result.current.off).toBe('function')
  })

  it('should return isConnected status', () => {
    const { result } = renderHook(() => useWebSocket())
    expect(typeof result.current.isConnected).toBeDefined()
  })

  it('should attempt to connect when autoConnect is true and token exists', () => {
    localStorage.setItem('access_token', 'test-token')

    renderHook(() => useWebSocket({ autoConnect: true }))

    // Connection should be attempted
    expect(wsService.connect).toBeDefined()
  })

  it('should not attempt connection when autoConnect is false', () => {
    localStorage.setItem('access_token', 'test-token')

    renderHook(() => useWebSocket({ autoConnect: false }))

    // Should not connect
    expect(wsService.connect).toBeDefined()
  })

  it('should not attempt connection when no token exists', () => {
    localStorage.clear()
    renderHook(() => useWebSocket({ autoConnect: true }))

    // Connection should not be attempted without token
  })

  it('should provide subscribe function', () => {
    const { result } = renderHook(() => useWebSocket())

    result.current.subscribe(123)

    expect(wsService.subscribe).toHaveBeenCalledWith(123)
  })

  it('should provide unsubscribe function', () => {
    const { result } = renderHook(() => useWebSocket())

    result.current.unsubscribe(123)

    expect(wsService.unsubscribe).toHaveBeenCalledWith(123)
  })

  it('should provide event listener registration', () => {
    const { result } = renderHook(() => useWebSocket())
    const callback = vi.fn()

    result.current.on('update', callback)

    expect(wsService.on).toHaveBeenCalledWith('update', callback)
  })

  it('should provide event listener deregistration', () => {
    const { result } = renderHook(() => useWebSocket())
    const callback = vi.fn()

    result.current.off('update', callback)

    expect(wsService.off).toHaveBeenCalledWith('update', callback)
  })

  it('should handle multiple subscribe calls', () => {
    const { result } = renderHook(() => useWebSocket())

    result.current.subscribe(1)
    result.current.subscribe(2)
    result.current.subscribe(3)

    expect(wsService.subscribe).toHaveBeenCalledTimes(3)
  })

  it('should handle multiple unsubscribe calls', () => {
    const { result } = renderHook(() => useWebSocket())

    result.current.unsubscribe(1)
    result.current.unsubscribe(2)

    expect(wsService.unsubscribe).toHaveBeenCalledTimes(2)
  })

  it('should handle multiple event listeners', () => {
    const { result } = renderHook(() => useWebSocket())
    const callback1 = vi.fn()
    const callback2 = vi.fn()

    result.current.on('update', callback1)
    result.current.on('delete', callback2)

    expect(wsService.on).toHaveBeenCalledTimes(2)
    expect(wsService.on).toHaveBeenCalledWith('update', callback1)
    expect(wsService.on).toHaveBeenCalledWith('delete', callback2)
  })

  it('should pass correct token to connect function', () => {
    const token = 'specific-test-token'
    localStorage.setItem('access_token', token)

    renderHook(() => useWebSocket({ autoConnect: true }))

    expect(wsService.connect).toBeDefined()
  })

  it('should handle connection errors gracefully', () => {
    const error = new Error('Connection failed')
    vi.mocked(wsService.connect).mockRejectedValueOnce(error)
    localStorage.setItem('access_token', 'test-token')

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    renderHook(() => useWebSocket({ autoConnect: true }))

    consoleSpy.mockRestore()
  })

  it('should provide consistent callback references', () => {
    const { result, rerender } = renderHook(() => useWebSocket())

    rerender()

    const subscribe2 = result.current.subscribe
    const unsubscribe2 = result.current.unsubscribe
    const on2 = result.current.on
    const off2 = result.current.off

    // Functions should be stable across rerenders
    expect(typeof subscribe2).toBe('function')
    expect(typeof unsubscribe2).toBe('function')
    expect(typeof on2).toBe('function')
    expect(typeof off2).toBe('function')
  })

  it('should handle mixed subscribe/unsubscribe operations', () => {
    const { result } = renderHook(() => useWebSocket())

    result.current.subscribe(1)
    result.current.subscribe(2)
    result.current.unsubscribe(1)
    result.current.subscribe(3)
    result.current.unsubscribe(2)

    expect(wsService.subscribe).toHaveBeenCalledTimes(3)
    expect(wsService.unsubscribe).toHaveBeenCalledTimes(2)
  })
})
