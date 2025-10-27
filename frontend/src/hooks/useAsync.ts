import { useState, useCallback, useEffect, useRef } from 'react'

interface UseAsyncState<T> {
  status: 'idle' | 'pending' | 'success' | 'error'
  data: T | null
  error: Error | null
}

interface UseAsyncReturn<T> extends UseAsyncState<T> {
  execute: () => Promise<void>
  reset: () => void
}

/**
 * Hook for handling async operations with proper cleanup and race condition prevention
 */
export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate = true
): UseAsyncReturn<T> {
  const [state, setState] = useState<UseAsyncState<T>>({
    status: 'idle',
    data: null,
    error: null,
  })

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true)
  // Track abort controller for canceling requests
  const abortControllerRef = useRef<AbortController | null>(null)

  const reset = useCallback(() => {
    if (isMountedRef.current) {
      setState({ status: 'idle', data: null, error: null })
    }
  }, [])

  const execute = useCallback(async () => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController()

    if (!isMountedRef.current) return

    setState({ status: 'pending', data: null, error: null })
    try {
      const response = await asyncFunction()

      // Only update state if component is still mounted and request wasn't aborted
      if (isMountedRef.current && !abortControllerRef.current?.signal.aborted) {
        setState({ status: 'success', data: response, error: null })
      }
    } catch (error) {
      // Don't update state if request was aborted (cleanup or new request)
      if (abortControllerRef.current?.signal.aborted) {
        return
      }

      if (isMountedRef.current) {
        setState({
          status: 'error',
          data: null,
          error: error instanceof Error ? error : new Error('Unknown error'),
        })
      }
    }
  }, [asyncFunction])

  useEffect(() => {
    if (immediate) {
      execute()
    }

    return () => {
      // Cleanup: mark as unmounted and abort any pending requests
      isMountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [execute, immediate])

  return { ...state, execute, reset }
}
