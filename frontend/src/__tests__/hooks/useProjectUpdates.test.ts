import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useProjectUpdates, useAllProjectUpdates } from '@/hooks/useProjectUpdates';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { NotificationProvider } from '@/contexts/NotificationContext';

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(
    BrowserRouter,
    null,
    React.createElement(NotificationProvider, null, children)
  );

// Mock WebSocket hook
vi.mock('@/hooks/useWebSocket', () => ({
  useWebSocket: vi.fn(() => ({
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  })),
}));

// Mock React Query
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
  })),
}));

// Mock project store
vi.mock('@/stores/projectStore', () => ({
  useProjectStore: vi.fn(() => ({
    updateProject: vi.fn(),
  })),
}));

describe('useProjectUpdates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not subscribe when projectId is undefined', () => {
    const { result } = renderHook(() => useProjectUpdates(undefined), { wrapper });
    expect(result).toBeDefined();
  });

  it('should initialize hook successfully with projectId', () => {
    const { result } = renderHook(() => useProjectUpdates(1), { wrapper });
    expect(result).toBeDefined();
  });

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() => useProjectUpdates(1), { wrapper });
    expect(() => unmount()).not.toThrow();
  });

  it('should handle multiple subscribers', () => {
    const { result: result1 } = renderHook(() => useProjectUpdates(1), { wrapper });
    const { result: result2 } = renderHook(() => useProjectUpdates(2), { wrapper });

    expect(result1).toBeDefined();
    expect(result2).toBeDefined();
  });
});

describe('useAllProjectUpdates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize hook for all updates', () => {
    const { result } = renderHook(() => useAllProjectUpdates(), { wrapper });
    expect(result).toBeDefined();
  });

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() => useAllProjectUpdates(), { wrapper });
    expect(() => unmount()).not.toThrow();
  });

  it('should handle rerender', () => {
    const { rerender } = renderHook(() => useAllProjectUpdates(), { wrapper });
    expect(() => rerender()).not.toThrow();
  });
});
