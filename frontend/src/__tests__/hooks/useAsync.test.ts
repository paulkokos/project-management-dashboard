import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAsync } from '@/hooks';

describe('useAsync Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with idle status', () => {
    const mockAsyncFn = vi.fn().mockResolvedValue('data');
    const { result } = renderHook(() => useAsync(mockAsyncFn, false));

    expect(result.current.status).toBe('idle');
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should execute async function immediately when immediate is true', async () => {
    const mockAsyncFn = vi.fn().mockResolvedValue('test data');
    const { result } = renderHook(() => useAsync(mockAsyncFn, true));

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    expect(result.current.data).toBe('test data');
    expect(mockAsyncFn).toHaveBeenCalled();
  });

  it('should not execute async function when immediate is false', async () => {
    const mockAsyncFn = vi.fn().mockResolvedValue('test data');
    const { result } = renderHook(() => useAsync(mockAsyncFn, false));

    await waitFor(() => {
      expect(result.current.status).toBe('idle');
    });

    expect(mockAsyncFn).not.toHaveBeenCalled();
  });

  it('should set status to pending when executing', async () => {
    const mockAsyncFn = vi.fn(
      () => new Promise((resolve) => setTimeout(() => resolve('data'), 100))
    );
    const { result } = renderHook(() => useAsync(mockAsyncFn, false));

    act(() => {
      result.current.execute();
    });

    expect(result.current.status).toBe('pending');
  });

  it('should set status to success when async function resolves', async () => {
    const mockAsyncFn = vi.fn().mockResolvedValue('success data');
    const { result } = renderHook(() => useAsync(mockAsyncFn, true));

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    expect(result.current.data).toBe('success data');
  });

  it('should set status to error when async function rejects', async () => {
    const error = new Error('Test error');
    const mockAsyncFn = vi.fn().mockRejectedValue(error);
    const { result } = renderHook(() => useAsync(mockAsyncFn, true));

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });

    expect(result.current.error?.message).toBe('Test error');
  });

  it('should handle non-Error objects thrown from async function', async () => {
    const mockAsyncFn = vi.fn().mockRejectedValue('String error');
    const { result } = renderHook(() => useAsync(mockAsyncFn, true));

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });

    expect(result.current.error?.message).toBe('Unknown error');
  });

  it('should allow manual execution via execute function', async () => {
    const mockAsyncFn = vi.fn().mockResolvedValue('manual data');
    const { result } = renderHook(() => useAsync(mockAsyncFn, false));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.status).toBe('success');
    expect(result.current.data).toBe('manual data');
  });

  it('should clear data when executing again', async () => {
    const mockAsyncFn = vi
      .fn()
      .mockResolvedValueOnce('first data')
      .mockResolvedValueOnce('second data');

    const { result } = renderHook(() => useAsync(mockAsyncFn, true));

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    expect(result.current.data).toBe('first data');

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.data).toBe('second data');
  });

  it('should handle multiple sequential executions', async () => {
    const mockAsyncFn = vi.fn().mockResolvedValue('data');
    const { result } = renderHook(() => useAsync(mockAsyncFn, false));

    await act(async () => {
      await result.current.execute();
    });
    expect(result.current.status).toBe('success');

    await act(async () => {
      await result.current.execute();
    });
    expect(result.current.status).toBe('success');
    expect(mockAsyncFn).toHaveBeenCalledTimes(2);
  });

  it('should return execute function in hook return value', () => {
    const mockAsyncFn = vi.fn();
    const { result } = renderHook(() => useAsync(mockAsyncFn, false));

    expect(typeof result.current.execute).toBe('function');
  });

  it('should handle promise that resolves with complex data', async () => {
    const complexData = { id: 1, name: 'Test', nested: { value: 'data' } };
    const mockAsyncFn = vi.fn().mockResolvedValue(complexData);
    const { result } = renderHook(() => useAsync(mockAsyncFn, true));

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    expect(result.current.data).toEqual(complexData);
  });
});
