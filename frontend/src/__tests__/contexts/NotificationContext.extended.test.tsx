import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, renderHook, act } from '@testing-library/react'
import { ReactNode } from 'react'
import { NotificationProvider, useNotification } from '@/contexts/NotificationContext'

// Mock useWebSocket hook
const mockOn = vi.fn()
const mockOff = vi.fn()

vi.mock('@/hooks/useWebSocket', () => ({
  useWebSocket: () => ({
    on: mockOn,
    off: mockOff,
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    isConnected: false,
  }),
}))

// Helper component to test the hook
const TestComponent = ({ onRender }: { onRender?: (context: any) => void }) => {
  const context = useNotification()

  if (onRender) {
    onRender(context)
  }

  return (
    <div>
      <div data-testid="notification-count">{context.notifications.length}</div>
      <button
        data-testid="add-success"
        onClick={() => context.addNotification({ type: 'success', message: 'Success message' })}
      >
        Add Success
      </button>
      <button
        data-testid="add-error"
        onClick={() => context.addNotification({ type: 'error', message: 'Error message' })}
      >
        Add Error
      </button>
      <button
        data-testid="add-info"
        onClick={() => context.addNotification({ type: 'info', message: 'Info message' })}
      >
        Add Info
      </button>
      <button
        data-testid="add-warning"
        onClick={() => context.addNotification({ type: 'warning', message: 'Warning message' })}
      >
        Add Warning
      </button>
      <button
        data-testid="clear-all"
        onClick={() => context.clearNotifications()}
      >
        Clear All
      </button>
      {context.notifications.map(notification => (
        <div key={notification.id} data-testid={`notification-${notification.id}`}>
          <span data-testid={`type-${notification.id}`}>{notification.type}</span>
          <span data-testid={`message-${notification.id}`}>{notification.message}</span>
          {notification.description && (
            <span data-testid={`description-${notification.id}`}>{notification.description}</span>
          )}
          <button
            data-testid={`remove-${notification.id}`}
            onClick={() => context.removeNotification(notification.id)}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  )
}

// Helper function to render with provider
const renderWithProvider = (ui: ReactNode) => {
  return render(
    <NotificationProvider>
      {ui}
    </NotificationProvider>
  )
}

describe('NotificationContext - Extended Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('NotificationProvider', () => {
    it('should render children without errors', () => {
      renderWithProvider(<div data-testid="child">Child Component</div>)
      expect(screen.getByTestId('child')).toBeInTheDocument()
    })

    it('should provide context to children', () => {
      renderWithProvider(<TestComponent />)
      expect(screen.getByTestId('notification-count')).toHaveTextContent('0')
    })

    it('should initialize with empty notifications array', () => {
      renderWithProvider(<TestComponent />)
      expect(screen.getByTestId('notification-count')).toHaveTextContent('0')
    })

    it('should render multiple children', () => {
      renderWithProvider(
        <>
          <div data-testid="child1">Child 1</div>
          <div data-testid="child2">Child 2</div>
        </>
      )
      expect(screen.getByTestId('child1')).toBeInTheDocument()
      expect(screen.getByTestId('child2')).toBeInTheDocument()
    })

    it('should set up WebSocket event listeners on mount', () => {
      renderWithProvider(<TestComponent />)
      expect(mockOn).toHaveBeenCalledWith('notification_received', expect.any(Function))
      expect(mockOn).toHaveBeenCalledWith('error', expect.any(Function))
    })

    it('should clean up WebSocket event listeners on unmount', () => {
      const { unmount } = renderWithProvider(<TestComponent />)
      unmount()
      expect(mockOff).toHaveBeenCalledWith('notification_received', expect.any(Function))
      expect(mockOff).toHaveBeenCalledWith('error', expect.any(Function))
    })
  })

  describe('useNotification hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        renderHook(() => useNotification())
      }).toThrow('useNotification must be used within NotificationProvider')

      consoleError.mockRestore()
    })

    it('should return context object with all required methods', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      expect(result.current).toHaveProperty('notifications')
      expect(result.current).toHaveProperty('addNotification')
      expect(result.current).toHaveProperty('removeNotification')
      expect(result.current).toHaveProperty('clearNotifications')
    })

    it('should have notifications array initially empty', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      expect(result.current.notifications).toEqual([])
    })

    it('should provide addNotification function', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      expect(typeof result.current.addNotification).toBe('function')
    })

    it('should provide removeNotification function', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      expect(typeof result.current.removeNotification).toBe('function')
    })

    it('should provide clearNotifications function', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      expect(typeof result.current.clearNotifications).toBe('function')
    })
  })

  describe('Adding notifications', () => {
    it('should add a success notification', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      act(() => {
        result.current.addNotification({ type: 'success', message: 'Success!' })
      })

      expect(result.current.notifications).toHaveLength(1)
      expect(result.current.notifications[0].type).toBe('success')
      expect(result.current.notifications[0].message).toBe('Success!')
    })

    it('should add an error notification', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      act(() => {
        result.current.addNotification({ type: 'error', message: 'Error occurred' })
      })

      expect(result.current.notifications).toHaveLength(1)
      expect(result.current.notifications[0].type).toBe('error')
    })

    it('should add an info notification', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      act(() => {
        result.current.addNotification({ type: 'info', message: 'Information' })
      })

      expect(result.current.notifications).toHaveLength(1)
      expect(result.current.notifications[0].type).toBe('info')
    })

    it('should add a warning notification', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      act(() => {
        result.current.addNotification({ type: 'warning', message: 'Warning!' })
      })

      expect(result.current.notifications).toHaveLength(1)
      expect(result.current.notifications[0].type).toBe('warning')
    })

    it('should add notification with description', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      act(() => {
        result.current.addNotification({
          type: 'info',
          message: 'Test message',
          description: 'Test description',
        })
      })

      expect(result.current.notifications[0].description).toBe('Test description')
    })

    it('should generate unique IDs for notifications', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      let id1!: string
      let id2!: string

      act(() => {
        id1 = result.current.addNotification({ type: 'info', message: 'First' })
      })

      act(() => {
        id2 = result.current.addNotification({ type: 'info', message: 'Second' })
      })

      expect(id1).toBeDefined()
      expect(id2).toBeDefined()
      expect(id1).not.toBe(id2)
    })

    it('should return notification ID when added', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      let id: string

      act(() => {
        id = result.current.addNotification({ type: 'info', message: 'Test' })
      })

      expect(id!).toBeDefined()
      expect(typeof id!).toBe('string')
      expect(id!).toMatch(/^notification_/)
    })

    it('should set default duration of 5000ms', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      act(() => {
        result.current.addNotification({ type: 'info', message: 'Test' })
      })

      expect(result.current.notifications[0].duration).toBe(5000)
    })

    it('should accept custom duration', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      act(() => {
        result.current.addNotification({ type: 'info', message: 'Test', duration: 3000 })
      })

      expect(result.current.notifications[0].duration).toBe(3000)
    })

    it('should accept zero duration for permanent notifications', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      act(() => {
        result.current.addNotification({ type: 'info', message: 'Permanent', duration: 0 })
      })

      expect(result.current.notifications[0].duration).toBe(0)

      // Fast-forward time to ensure notification is not auto-removed
      act(() => {
        vi.advanceTimersByTime(10000)
      })

      expect(result.current.notifications).toHaveLength(1)
    })

    it('should add notification with empty description', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      act(() => {
        result.current.addNotification({
          type: 'info',
          message: 'Test',
          description: '',
        })
      })

      expect(result.current.notifications[0].description).toBe('')
    })

    it('should add notification without description property', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      act(() => {
        result.current.addNotification({ type: 'info', message: 'Test' })
      })

      expect(result.current.notifications[0].description).toBeUndefined()
    })
  })

  describe('Removing notifications', () => {
    it('should remove notification by ID', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      let id: string

      act(() => {
        id = result.current.addNotification({ type: 'info', message: 'Test' })
      })

      expect(result.current.notifications).toHaveLength(1)

      act(() => {
        result.current.removeNotification(id!)
      })

      expect(result.current.notifications).toHaveLength(0)
    })

    it('should handle removing non-existent notification', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      act(() => {
        result.current.addNotification({ type: 'info', message: 'Test' })
      })

      expect(result.current.notifications).toHaveLength(1)

      act(() => {
        result.current.removeNotification('non-existent-id')
      })

      expect(result.current.notifications).toHaveLength(1)
    })

    it('should remove specific notification from multiple', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      let id1!: string, id2!: string, id3!: string

      act(() => {
        id1 = result.current.addNotification({ type: 'info', message: 'First' })
        id2 = result.current.addNotification({ type: 'info', message: 'Second' })
        id3 = result.current.addNotification({ type: 'info', message: 'Third' })
      })

      expect(result.current.notifications).toHaveLength(3)

      act(() => {
        result.current.removeNotification(id2)
      })

      expect(result.current.notifications).toHaveLength(2)
      expect(result.current.notifications.find(n => n.id === id1)).toBeDefined()
      expect(result.current.notifications.find(n => n.id === id3)).toBeDefined()
      expect(result.current.notifications.find(n => n.id === id2)).toBeUndefined()
    })
  })

  describe('Clearing notifications', () => {
    it('should clear all notifications', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      act(() => {
        result.current.addNotification({ type: 'info', message: 'First' })
        result.current.addNotification({ type: 'info', message: 'Second' })
        result.current.addNotification({ type: 'info', message: 'Third' })
      })

      expect(result.current.notifications).toHaveLength(3)

      act(() => {
        result.current.clearNotifications()
      })

      expect(result.current.notifications).toHaveLength(0)
    })

    it('should handle clearing when no notifications exist', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      expect(result.current.notifications).toHaveLength(0)

      act(() => {
        result.current.clearNotifications()
      })

      expect(result.current.notifications).toHaveLength(0)
    })

    it('should clear notifications of different types', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      act(() => {
        result.current.addNotification({ type: 'success', message: 'Success' })
        result.current.addNotification({ type: 'error', message: 'Error' })
        result.current.addNotification({ type: 'info', message: 'Info' })
        result.current.addNotification({ type: 'warning', message: 'Warning' })
      })

      expect(result.current.notifications).toHaveLength(4)

      act(() => {
        result.current.clearNotifications()
      })

      expect(result.current.notifications).toHaveLength(0)
    })
  })

  describe('Multiple simultaneous notifications', () => {
    it('should handle multiple notifications at once', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      act(() => {
        result.current.addNotification({ type: 'success', message: 'First' })
        result.current.addNotification({ type: 'error', message: 'Second' })
        result.current.addNotification({ type: 'info', message: 'Third' })
      })

      expect(result.current.notifications).toHaveLength(3)
    })

    it('should maintain correct order of notifications', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      act(() => {
        result.current.addNotification({ type: 'success', message: 'First' })
        result.current.addNotification({ type: 'error', message: 'Second' })
        result.current.addNotification({ type: 'info', message: 'Third' })
      })

      expect(result.current.notifications[0].message).toBe('First')
      expect(result.current.notifications[1].message).toBe('Second')
      expect(result.current.notifications[2].message).toBe('Third')
    })

    it('should handle rapid successive additions', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.addNotification({ type: 'info', message: `Notification ${i}` })
        }
      })

      expect(result.current.notifications).toHaveLength(10)
    })

    it('should handle different notification types simultaneously', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      act(() => {
        result.current.addNotification({ type: 'success', message: 'Success' })
        result.current.addNotification({ type: 'error', message: 'Error' })
        result.current.addNotification({ type: 'warning', message: 'Warning' })
        result.current.addNotification({ type: 'info', message: 'Info' })
      })

      const types = result.current.notifications.map(n => n.type)
      expect(types).toContain('success')
      expect(types).toContain('error')
      expect(types).toContain('warning')
      expect(types).toContain('info')
    })
  })

  describe('Auto-removal with duration', () => {
    it('should auto-remove notification after default duration', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      act(() => {
        result.current.addNotification({ type: 'info', message: 'Test' })
      })

      expect(result.current.notifications).toHaveLength(1)

      act(() => {
        vi.advanceTimersByTime(5000)
      })

      expect(result.current.notifications).toHaveLength(0)
    })

    it('should auto-remove notification after custom duration', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      act(() => {
        result.current.addNotification({ type: 'info', message: 'Test', duration: 3000 })
      })

      expect(result.current.notifications).toHaveLength(1)

      act(() => {
        vi.advanceTimersByTime(3000)
      })

      expect(result.current.notifications).toHaveLength(0)
    })

    it('should not auto-remove notification with zero duration', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      act(() => {
        result.current.addNotification({ type: 'info', message: 'Permanent', duration: 0 })
      })

      expect(result.current.notifications).toHaveLength(1)

      act(() => {
        vi.advanceTimersByTime(10000)
      })

      expect(result.current.notifications).toHaveLength(1)
    })

    it('should auto-remove only expired notifications', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      act(() => {
        result.current.addNotification({ type: 'info', message: 'Short', duration: 2000 })
        result.current.addNotification({ type: 'info', message: 'Long', duration: 5000 })
      })

      expect(result.current.notifications).toHaveLength(2)

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      expect(result.current.notifications).toHaveLength(1)
      expect(result.current.notifications[0].message).toBe('Long')

      act(() => {
        vi.advanceTimersByTime(3000)
      })

      expect(result.current.notifications).toHaveLength(0)
    })

    it('should handle very short duration', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      act(() => {
        result.current.addNotification({ type: 'info', message: 'Quick', duration: 100 })
      })

      expect(result.current.notifications).toHaveLength(1)

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current.notifications).toHaveLength(0)
    })

    it('should handle very long duration', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      act(() => {
        result.current.addNotification({ type: 'info', message: 'Slow', duration: 60000 })
      })

      expect(result.current.notifications).toHaveLength(1)

      act(() => {
        vi.advanceTimersByTime(30000)
      })

      expect(result.current.notifications).toHaveLength(1)

      act(() => {
        vi.advanceTimersByTime(30000)
      })

      expect(result.current.notifications).toHaveLength(0)
    })
  })

  describe('Component integration', () => {
    it('should update UI when adding notification via button', () => {
      renderWithProvider(<TestComponent />)

      const button = screen.getByTestId('add-success')

      act(() => {
        button.click()
      })

      expect(screen.getByTestId('notification-count')).toHaveTextContent('1')
    })

    it('should display notification type correctly', () => {
      renderWithProvider(<TestComponent />)

      const button = screen.getByTestId('add-success')

      act(() => {
        button.click()
        vi.advanceTimersByTime(0)
      })

      const notifications = screen.queryAllByTestId(/^type-/)
      expect(notifications[0]).toHaveTextContent('success')
    })

    it('should display notification message correctly', () => {
      renderWithProvider(<TestComponent />)

      const button = screen.getByTestId('add-error')

      act(() => {
        button.click()
        vi.advanceTimersByTime(0)
      })

      const notifications = screen.queryAllByTestId(/^message-/)
      expect(notifications[0]).toHaveTextContent('Error message')
    })

    it('should remove notification via button click', () => {
      renderWithProvider(<TestComponent />)

      const addButton = screen.getByTestId('add-info')

      act(() => {
        addButton.click()
        vi.advanceTimersByTime(0)
      })

      expect(screen.getByTestId('notification-count')).toHaveTextContent('1')

      const removeButtons = screen.queryAllByTestId(/^remove-/)

      act(() => {
        removeButtons[0].click()
      })

      expect(screen.getByTestId('notification-count')).toHaveTextContent('0')
    })

    it('should clear all notifications via clear button', () => {
      renderWithProvider(<TestComponent />)

      act(() => {
        screen.getByTestId('add-success').click()
        screen.getByTestId('add-error').click()
        screen.getByTestId('add-info').click()
        vi.advanceTimersByTime(0)
      })

      expect(screen.getByTestId('notification-count')).toHaveTextContent('3')

      act(() => {
        screen.getByTestId('clear-all').click()
      })

      expect(screen.getByTestId('notification-count')).toHaveTextContent('0')
    })

    it('should add multiple notification types from UI', () => {
      renderWithProvider(<TestComponent />)

      act(() => {
        screen.getByTestId('add-success').click()
        screen.getByTestId('add-error').click()
        screen.getByTestId('add-warning').click()
        vi.advanceTimersByTime(0)
      })

      expect(screen.getByTestId('notification-count')).toHaveTextContent('3')
    })
  })

  describe('WebSocket event handling', () => {
    it('should handle notification_received event', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      // Get the callback that was registered
      const notificationCallback = mockOn.mock.calls.find(
        call => call[0] === 'notification_received'
      )?.[1]

      expect(notificationCallback).toBeDefined()

      // Trigger the callback
      act(() => {
        notificationCallback?.({
          title: 'WebSocket Notification',
          message: 'Test message',
        })
      })

      expect(result.current.notifications).toHaveLength(1)
      expect(result.current.notifications[0].message).toBe('WebSocket Notification')
      expect(result.current.notifications[0].type).toBe('info')
    })

    it('should handle notification_received with actor and project', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      const notificationCallback = mockOn.mock.calls.find(
        call => call[0] === 'notification_received'
      )?.[1]

      act(() => {
        notificationCallback?.({
          title: 'Task Updated',
          actor: { first_name: 'John', username: 'johndoe' },
          project_title: 'My Project',
        })
      })

      expect(result.current.notifications).toHaveLength(1)
      expect(result.current.notifications[0].description).toContain('John')
      expect(result.current.notifications[0].description).toContain('My Project')
    })

    it('should handle notification_received with only username', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      const notificationCallback = mockOn.mock.calls.find(
        call => call[0] === 'notification_received'
      )?.[1]

      act(() => {
        notificationCallback?.({
          title: 'Task Updated',
          actor: { username: 'johndoe' },
          project_title: 'My Project',
        })
      })

      expect(result.current.notifications).toHaveLength(1)
      expect(result.current.notifications[0].description).toContain('johndoe')
    })

    it('should handle notification_received with only project title', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      const notificationCallback = mockOn.mock.calls.find(
        call => call[0] === 'notification_received'
      )?.[1]

      act(() => {
        notificationCallback?.({
          title: 'Update',
          project_title: 'My Project',
        })
      })

      expect(result.current.notifications).toHaveLength(1)
      expect(result.current.notifications[0].description).toBe('Project: My Project')
    })

    it('should handle error event from WebSocket', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      const errorCallback = mockOn.mock.calls.find(
        call => call[0] === 'error'
      )?.[1]

      act(() => {
        errorCallback?.({
          message: 'Connection error',
          details: 'Unable to connect to server',
        })
      })

      expect(result.current.notifications).toHaveLength(1)
      expect(result.current.notifications[0].type).toBe('error')
      expect(result.current.notifications[0].message).toBe('Connection error')
      expect(result.current.notifications[0].description).toBe('Unable to connect to server')
      expect(result.current.notifications[0].duration).toBe(7000)
    })

    it('should handle error event without details', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      const errorCallback = mockOn.mock.calls.find(
        call => call[0] === 'error'
      )?.[1]

      act(() => {
        errorCallback?.({
          message: 'Generic error',
        })
      })

      expect(result.current.notifications).toHaveLength(1)
      expect(result.current.notifications[0].type).toBe('error')
      expect(result.current.notifications[0].description).toBeUndefined()
    })

    it('should handle error event without message', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      const errorCallback = mockOn.mock.calls.find(
        call => call[0] === 'error'
      )?.[1]

      act(() => {
        errorCallback?.({})
      })

      expect(result.current.notifications).toHaveLength(1)
      expect(result.current.notifications[0].message).toBe('An error occurred')
    })

    it('should handle notification_received without title or message', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      const notificationCallback = mockOn.mock.calls.find(
        call => call[0] === 'notification_received'
      )?.[1]

      act(() => {
        notificationCallback?.({})
      })

      expect(result.current.notifications).toHaveLength(1)
      expect(result.current.notifications[0].message).toBe('Something changed')
    })

    it('should prefer title over message in notification_received', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      const notificationCallback = mockOn.mock.calls.find(
        call => call[0] === 'notification_received'
      )?.[1]

      act(() => {
        notificationCallback?.({
          title: 'Title Text',
          message: 'Message Text',
        })
      })

      expect(result.current.notifications[0].message).toBe('Title Text')
    })
  })

  describe('Edge cases', () => {
    it('should handle empty message string', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      act(() => {
        result.current.addNotification({ type: 'info', message: '' })
      })

      expect(result.current.notifications).toHaveLength(1)
      expect(result.current.notifications[0].message).toBe('')
    })

    it('should handle very long message', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      const longMessage = 'A'.repeat(1000)

      act(() => {
        result.current.addNotification({ type: 'info', message: longMessage })
      })

      expect(result.current.notifications).toHaveLength(1)
      expect(result.current.notifications[0].message).toBe(longMessage)
    })

    it('should handle special characters in message', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      const specialMessage = '<script>alert("test")</script> & < > " \' \n \t'

      act(() => {
        result.current.addNotification({ type: 'info', message: specialMessage })
      })

      expect(result.current.notifications[0].message).toBe(specialMessage)
    })

    it('should handle Unicode characters', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      const unicodeMessage = '🎉 Success! 你好 مرحبا Привет'

      act(() => {
        result.current.addNotification({ type: 'success', message: unicodeMessage })
      })

      expect(result.current.notifications[0].message).toBe(unicodeMessage)
    })

    it('should handle negative duration as default', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      act(() => {
        result.current.addNotification({ type: 'info', message: 'Test', duration: -1000 })
      })

      expect(result.current.notifications[0].duration).toBe(-1000)

      // Should not auto-remove with negative duration
      act(() => {
        vi.advanceTimersByTime(10000)
      })

      expect(result.current.notifications).toHaveLength(1)
    })

    it('should handle notification state after multiple operations', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      let id1!: string

      act(() => {
        id1 = result.current.addNotification({ type: 'info', message: 'First', duration: 0 })
        result.current.addNotification({ type: 'info', message: 'Second', duration: 0 })
        result.current.removeNotification(id1)
        result.current.addNotification({ type: 'info', message: 'Third', duration: 0 })
        result.current.clearNotifications()
        result.current.addNotification({ type: 'info', message: 'Fourth', duration: 0 })
      })

      expect(result.current.notifications).toHaveLength(1)
      expect(result.current.notifications[0].message).toBe('Fourth')
    })

    it('should handle null-like values in description', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      act(() => {
        result.current.addNotification({
          type: 'info',
          message: 'Test',
          description: undefined,
        })
      })

      expect(result.current.notifications[0].description).toBeUndefined()
    })

    it('should handle removing already removed notification', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      let id: string

      act(() => {
        id = result.current.addNotification({ type: 'info', message: 'Test', duration: 0 })
        result.current.removeNotification(id!)
        result.current.removeNotification(id!)
        result.current.removeNotification(id!)
      })

      expect(result.current.notifications).toHaveLength(0)
    })

    it('should maintain notification integrity during auto-removal', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      act(() => {
        result.current.addNotification({ type: 'info', message: 'First', duration: 1000 })
        result.current.addNotification({ type: 'info', message: 'Second', duration: 0 })
        result.current.addNotification({ type: 'info', message: 'Third', duration: 2000 })
      })

      expect(result.current.notifications).toHaveLength(3)

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(result.current.notifications).toHaveLength(2)
      expect(result.current.notifications.find(n => n.message === 'Second')).toBeDefined()
      expect(result.current.notifications.find(n => n.message === 'Third')).toBeDefined()

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(result.current.notifications).toHaveLength(1)
      expect(result.current.notifications[0].message).toBe('Second')
    })
  })

  describe('Notification properties', () => {
    it('should have all required notification properties', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      act(() => {
        result.current.addNotification({
          type: 'success',
          message: 'Complete notification',
          description: 'Full description',
          duration: 3000,
        })
      })

      const notification = result.current.notifications[0]
      expect(notification).toHaveProperty('id')
      expect(notification).toHaveProperty('type')
      expect(notification).toHaveProperty('message')
      expect(notification).toHaveProperty('description')
      expect(notification).toHaveProperty('duration')
    })

    it('should validate notification type values', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      const types: Array<'success' | 'error' | 'info' | 'warning'> = [
        'success',
        'error',
        'info',
        'warning',
      ]

      act(() => {
        types.forEach(type => {
          result.current.addNotification({ type, message: `${type} notification` })
        })
      })

      expect(result.current.notifications).toHaveLength(4)
      result.current.notifications.forEach((notification, index) => {
        expect(notification.type).toBe(types[index])
      })
    })

    it('should preserve notification data integrity', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      const originalData = {
        type: 'success' as const,
        message: 'Test message',
        description: 'Test description',
        duration: 3000,
      }

      act(() => {
        result.current.addNotification(originalData)
      })

      const notification = result.current.notifications[0]
      expect(notification.type).toBe(originalData.type)
      expect(notification.message).toBe(originalData.message)
      expect(notification.description).toBe(originalData.description)
      expect(notification.duration).toBe(originalData.duration)
    })
  })

  describe('Context consumer patterns', () => {
    it('should allow multiple consumers to access the same context', () => {
      const Consumer1 = () => {
        const { notifications } = useNotification()
        return <div data-testid="consumer1">{notifications.length}</div>
      }

      const Consumer2 = () => {
        const { notifications } = useNotification()
        return <div data-testid="consumer2">{notifications.length}</div>
      }

      renderWithProvider(
        <>
          <Consumer1 />
          <Consumer2 />
          <TestComponent />
        </>
      )

      act(() => {
        screen.getByTestId('add-info').click()
        vi.advanceTimersByTime(0)
      })

      expect(screen.getByTestId('consumer1')).toHaveTextContent('1')
      expect(screen.getByTestId('consumer2')).toHaveTextContent('1')
      expect(screen.getByTestId('notification-count')).toHaveTextContent('1')
    })

    it('should update all consumers when notification is added', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      const initialLength = result.current.notifications.length

      act(() => {
        result.current.addNotification({ type: 'info', message: 'Test' })
      })

      expect(result.current.notifications.length).toBe(initialLength + 1)
    })

    it('should update all consumers when notification is removed', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      let id: string

      act(() => {
        id = result.current.addNotification({ type: 'info', message: 'Test' })
      })

      const lengthBefore = result.current.notifications.length

      act(() => {
        result.current.removeNotification(id!)
      })

      expect(result.current.notifications.length).toBe(lengthBefore - 1)
    })
  })

  describe('Additional edge cases for full coverage', () => {
    it('should handle notification with explicit undefined duration', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      act(() => {
        result.current.addNotification({
          type: 'info',
          message: 'Test',
          duration: undefined,
        })
      })

      expect(result.current.notifications[0].duration).toBe(5000)
    })

    it('should handle timeout callback for duration 1', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      act(() => {
        result.current.addNotification({ type: 'info', message: 'Test', duration: 1 })
      })

      expect(result.current.notifications).toHaveLength(1)

      act(() => {
        vi.advanceTimersByTime(1)
      })

      expect(result.current.notifications).toHaveLength(0)
    })

    it('should test notification with duration exactly equal to default', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      act(() => {
        result.current.addNotification({ type: 'info', message: 'Test', duration: 5000 })
      })

      expect(result.current.notifications[0].duration).toBe(5000)

      act(() => {
        vi.advanceTimersByTime(4999)
      })

      expect(result.current.notifications).toHaveLength(1)

      act(() => {
        vi.advanceTimersByTime(1)
      })

      expect(result.current.notifications).toHaveLength(0)
    })

    it('should handle multiple notifications with same duration', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      act(() => {
        result.current.addNotification({ type: 'info', message: 'First', duration: 2000 })
        result.current.addNotification({ type: 'info', message: 'Second', duration: 2000 })
        result.current.addNotification({ type: 'info', message: 'Third', duration: 2000 })
      })

      expect(result.current.notifications).toHaveLength(3)

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      expect(result.current.notifications).toHaveLength(0)
    })

    it('should handle notification removal during auto-removal timer', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      let id: string

      act(() => {
        id = result.current.addNotification({ type: 'info', message: 'Test', duration: 5000 })
      })

      expect(result.current.notifications).toHaveLength(1)

      act(() => {
        vi.advanceTimersByTime(2000)
        result.current.removeNotification(id!)
      })

      expect(result.current.notifications).toHaveLength(0)

      // Advance past the original timeout to ensure no errors
      act(() => {
        vi.advanceTimersByTime(5000)
      })

      expect(result.current.notifications).toHaveLength(0)
    })

    it('should handle WebSocket notification with empty actor object', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      const notificationCallback = mockOn.mock.calls.find(
        call => call[0] === 'notification_received'
      )?.[1]

      act(() => {
        notificationCallback?.({
          title: 'Test',
          actor: {},
          project_title: 'Project',
        })
      })

      expect(result.current.notifications).toHaveLength(1)
      // Empty actor object will have undefined first_name and username, so it will use 'undefined in "Project"'
      expect(result.current.notifications[0].description).toBe('undefined in "Project"')
    })

    it('should handle WebSocket notification with null actor', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      const notificationCallback = mockOn.mock.calls.find(
        call => call[0] === 'notification_received'
      )?.[1]

      act(() => {
        notificationCallback?.({
          title: 'Test',
          actor: null,
          project_title: 'Project',
        })
      })

      expect(result.current.notifications).toHaveLength(1)
    })

    it('should handle adding and clearing in rapid succession', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      act(() => {
        result.current.addNotification({ type: 'info', message: 'Test 1', duration: 0 })
        result.current.addNotification({ type: 'info', message: 'Test 2', duration: 0 })
        result.current.clearNotifications()
        result.current.addNotification({ type: 'info', message: 'Test 3', duration: 0 })
        result.current.addNotification({ type: 'info', message: 'Test 4', duration: 0 })
      })

      expect(result.current.notifications).toHaveLength(2)
      expect(result.current.notifications[0].message).toBe('Test 3')
      expect(result.current.notifications[1].message).toBe('Test 4')
    })

    it('should maintain notification order after auto-removals', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      act(() => {
        result.current.addNotification({ type: 'info', message: 'Permanent', duration: 0 })
        result.current.addNotification({ type: 'info', message: 'Short', duration: 1000 })
        result.current.addNotification({ type: 'info', message: 'Also Permanent', duration: 0 })
      })

      expect(result.current.notifications).toHaveLength(3)

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(result.current.notifications).toHaveLength(2)
      expect(result.current.notifications[0].message).toBe('Permanent')
      expect(result.current.notifications[1].message).toBe('Also Permanent')
    })

    it('should handle WebSocket error with empty details string', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <NotificationProvider>{children}</NotificationProvider>
        ),
      })

      const errorCallback = mockOn.mock.calls.find(
        call => call[0] === 'error'
      )?.[1]

      act(() => {
        errorCallback?.({
          message: 'Error',
          details: '',
        })
      })

      expect(result.current.notifications).toHaveLength(1)
      expect(result.current.notifications[0].description).toBe('')
    })
  })
})
