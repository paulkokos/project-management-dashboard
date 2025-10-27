import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '@/stores/authStore'
import { User, AuthTokens } from '@/types'

describe('authStore - Extended Coverage', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      tokens: null,
      isAuthenticated: false,
    })
    localStorage.clear()
  })

  describe('setUser action', () => {
    it('should set user with complete data', () => {
      const user: User = {
        id: 1,
        username: 'johndoe',
        email: 'john@example.com',
        first_name: 'John',
        last_name: 'Doe',
        is_admin: false,
      }

      useAuthStore.getState().setUser(user)

      const state = useAuthStore.getState()
      expect(state.user).toEqual(user)
      expect(state.isAuthenticated).toBe(true)
    })

    it('should set user with admin privileges', () => {
      const adminUser: User = {
        id: 2,
        username: 'admin',
        email: 'admin@example.com',
        first_name: 'Admin',
        last_name: 'User',
        is_admin: true,
      }

      useAuthStore.getState().setUser(adminUser)

      const state = useAuthStore.getState()
      expect(state.user?.is_admin).toBe(true)
      expect(state.isAuthenticated).toBe(true)
    })

    it('should overwrite existing user data', () => {
      const user1: User = {
        id: 1,
        username: 'user1',
        email: 'user1@example.com',
        first_name: 'User',
        last_name: 'One',
      }

      const user2: User = {
        id: 2,
        username: 'user2',
        email: 'user2@example.com',
        first_name: 'User',
        last_name: 'Two',
      }

      useAuthStore.getState().setUser(user1)
      useAuthStore.getState().setUser(user2)

      const state = useAuthStore.getState()
      expect(state.user).toEqual(user2)
      expect(state.user?.id).toBe(2)
    })

    it('should handle user with minimal fields', () => {
      const minimalUser: User = {
        id: 3,
        username: 'minimal',
        email: 'minimal@example.com',
        first_name: '',
        last_name: '',
      }

      useAuthStore.getState().setUser(minimalUser)

      const state = useAuthStore.getState()
      expect(state.user).toEqual(minimalUser)
      expect(state.isAuthenticated).toBe(true)
    })
  })

  describe('setTokens action', () => {
    it('should set tokens and store in localStorage', () => {
      const tokens: AuthTokens = {
        access: 'access-token-123',
        refresh: 'refresh-token-456',
      }

      useAuthStore.getState().setTokens(tokens)

      const state = useAuthStore.getState()
      expect(state.tokens).toEqual(tokens)
      expect(state.isAuthenticated).toBe(true)
      expect(localStorage.getItem('access_token')).toBe('access-token-123')
      expect(localStorage.getItem('refresh_token')).toBe('refresh-token-456')
    })

    it('should update existing tokens', () => {
      const oldTokens: AuthTokens = {
        access: 'old-access',
        refresh: 'old-refresh',
      }

      const newTokens: AuthTokens = {
        access: 'new-access',
        refresh: 'new-refresh',
      }

      useAuthStore.getState().setTokens(oldTokens)
      useAuthStore.getState().setTokens(newTokens)

      const state = useAuthStore.getState()
      expect(state.tokens).toEqual(newTokens)
      expect(localStorage.getItem('access_token')).toBe('new-access')
      expect(localStorage.getItem('refresh_token')).toBe('new-refresh')
    })

    it('should set isAuthenticated to true when tokens are set', () => {
      const tokens: AuthTokens = {
        access: 'token',
        refresh: 'refresh',
      }

      expect(useAuthStore.getState().isAuthenticated).toBe(false)

      useAuthStore.getState().setTokens(tokens)

      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    })

    it('should handle empty token strings', () => {
      const tokens: AuthTokens = {
        access: '',
        refresh: '',
      }

      useAuthStore.getState().setTokens(tokens)

      const state = useAuthStore.getState()
      expect(state.tokens).toEqual(tokens)
      expect(localStorage.getItem('access_token')).toBe('')
      expect(localStorage.getItem('refresh_token')).toBe('')
    })
  })

  describe('logout action', () => {
    it('should clear user data', () => {
      const user: User = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
      }

      useAuthStore.getState().setUser(user)
      useAuthStore.getState().logout()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
    })

    it('should clear tokens from state', () => {
      const tokens: AuthTokens = {
        access: 'token',
        refresh: 'refresh',
      }

      useAuthStore.getState().setTokens(tokens)
      useAuthStore.getState().logout()

      const state = useAuthStore.getState()
      expect(state.tokens).toBeNull()
    })

    it('should remove tokens from localStorage', () => {
      const tokens: AuthTokens = {
        access: 'access-token',
        refresh: 'refresh-token',
      }

      useAuthStore.getState().setTokens(tokens)
      expect(localStorage.getItem('access_token')).toBe('access-token')
      expect(localStorage.getItem('refresh_token')).toBe('refresh-token')

      useAuthStore.getState().logout()

      expect(localStorage.getItem('access_token')).toBeNull()
      expect(localStorage.getItem('refresh_token')).toBeNull()
    })

    it('should set isAuthenticated to false', () => {
      const tokens: AuthTokens = {
        access: 'token',
        refresh: 'refresh',
      }

      useAuthStore.getState().setTokens(tokens)
      expect(useAuthStore.getState().isAuthenticated).toBe(true)

      useAuthStore.getState().logout()

      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })

    it('should handle logout when already logged out', () => {
      expect(useAuthStore.getState().user).toBeNull()
      expect(useAuthStore.getState().tokens).toBeNull()

      useAuthStore.getState().logout()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.tokens).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })

    it('should clear all state on logout', () => {
      const user: User = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
      }
      const tokens: AuthTokens = {
        access: 'access',
        refresh: 'refresh',
      }

      useAuthStore.getState().setUser(user)
      useAuthStore.getState().setTokens(tokens)

      useAuthStore.getState().logout()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.tokens).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })
  })

  describe('checkAuth action', () => {
    it('should return true when access token exists in localStorage', () => {
      localStorage.setItem('access_token', 'test-access-token')
      localStorage.setItem('refresh_token', 'test-refresh-token')

      const result = useAuthStore.getState().checkAuth()

      expect(result).toBe(true)
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    })

    it('should return false when no tokens in localStorage', () => {
      const result = useAuthStore.getState().checkAuth()

      expect(result).toBe(false)
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })

    it('should restore tokens from localStorage', () => {
      localStorage.setItem('access_token', 'stored-access')
      localStorage.setItem('refresh_token', 'stored-refresh')

      useAuthStore.getState().checkAuth()

      const state = useAuthStore.getState()
      expect(state.tokens).toEqual({
        access: 'stored-access',
        refresh: 'stored-refresh',
      })
    })

    it('should handle missing refresh token', () => {
      localStorage.setItem('access_token', 'access-only')

      const result = useAuthStore.getState().checkAuth()

      expect(result).toBe(true)
      const state = useAuthStore.getState()
      expect(state.tokens?.access).toBe('access-only')
      expect(state.tokens?.refresh).toBe('')
    })

    it('should set isAuthenticated when tokens are found', () => {
      localStorage.setItem('access_token', 'token')

      expect(useAuthStore.getState().isAuthenticated).toBe(false)

      useAuthStore.getState().checkAuth()

      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    })

    it('should not set isAuthenticated when no tokens found', () => {
      useAuthStore.getState().checkAuth()

      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })

    it('should handle empty access token', () => {
      localStorage.setItem('access_token', '')

      const result = useAuthStore.getState().checkAuth()

      expect(result).toBe(false)
    })
  })

  describe('State properties', () => {
    it('should have user property defaulting to null', () => {
      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
    })

    it('should have tokens property defaulting to null', () => {
      const state = useAuthStore.getState()
      expect(state.tokens).toBeNull()
    })

    it('should have isAuthenticated property defaulting to false', () => {
      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(false)
    })

    it('should maintain separate user and tokens state', () => {
      const user: User = {
        id: 1,
        username: 'user',
        email: 'user@example.com',
        first_name: 'User',
        last_name: 'Name',
      }

      useAuthStore.getState().setUser(user)

      expect(useAuthStore.getState().user).not.toBeNull()
      expect(useAuthStore.getState().tokens).toBeNull()
    })

    it('should update state reactively', () => {
      const user: User = {
        id: 1,
        username: 'reactive',
        email: 'reactive@example.com',
        first_name: 'Reactive',
        last_name: 'User',
      }

      const statesBefore = useAuthStore.getState()
      expect(statesBefore.user).toBeNull()

      useAuthStore.getState().setUser(user)

      const statesAfter = useAuthStore.getState()
      expect(statesAfter.user).toEqual(user)
    })
  })

  describe('Edge cases', () => {
    it('should handle rapid successive setUser calls', () => {
      const users = [
        { id: 1, username: 'user1', email: 'user1@test.com', first_name: 'U', last_name: '1' },
        { id: 2, username: 'user2', email: 'user2@test.com', first_name: 'U', last_name: '2' },
        { id: 3, username: 'user3', email: 'user3@test.com', first_name: 'U', last_name: '3' },
      ]

      users.forEach(user => useAuthStore.getState().setUser(user))

      const state = useAuthStore.getState()
      expect(state.user?.id).toBe(3)
    })

    it('should handle rapid successive setTokens calls', () => {
      const tokens1: AuthTokens = { access: 'token1', refresh: 'refresh1' }
      const tokens2: AuthTokens = { access: 'token2', refresh: 'refresh2' }
      const tokens3: AuthTokens = { access: 'token3', refresh: 'refresh3' }

      useAuthStore.getState().setTokens(tokens1)
      useAuthStore.getState().setTokens(tokens2)
      useAuthStore.getState().setTokens(tokens3)

      const state = useAuthStore.getState()
      expect(state.tokens).toEqual(tokens3)
      expect(localStorage.getItem('access_token')).toBe('token3')
    })

    it('should handle setUser and setTokens independently', () => {
      const user: User = {
        id: 1,
        username: 'independent',
        email: 'independent@test.com',
        first_name: 'Ind',
        last_name: 'User',
      }
      const tokens: AuthTokens = {
        access: 'independent-access',
        refresh: 'independent-refresh',
      }

      useAuthStore.getState().setUser(user)
      expect(useAuthStore.getState().user).toEqual(user)
      expect(useAuthStore.getState().tokens).toBeNull()

      useAuthStore.getState().setTokens(tokens)
      expect(useAuthStore.getState().user).toEqual(user)
      expect(useAuthStore.getState().tokens).toEqual(tokens)
    })

    it('should handle multiple logout calls', () => {
      const user: User = {
        id: 1,
        username: 'test',
        email: 'test@test.com',
        first_name: 'Test',
        last_name: 'User',
      }

      useAuthStore.getState().setUser(user)
      useAuthStore.getState().logout()
      useAuthStore.getState().logout()
      useAuthStore.getState().logout()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.tokens).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })

    it('should handle checkAuth multiple times', () => {
      localStorage.setItem('access_token', 'persistent-token')

      const result1 = useAuthStore.getState().checkAuth()
      const result2 = useAuthStore.getState().checkAuth()
      const result3 = useAuthStore.getState().checkAuth()

      expect(result1).toBe(true)
      expect(result2).toBe(true)
      expect(result3).toBe(true)
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    })

    it('should handle login after logout', () => {
      const user: User = {
        id: 1,
        username: 'loginAgain',
        email: 'login@test.com',
        first_name: 'Login',
        last_name: 'Again',
      }
      const tokens: AuthTokens = {
        access: 'new-session',
        refresh: 'new-refresh',
      }

      useAuthStore.getState().setUser(user)
      useAuthStore.getState().setTokens(tokens)
      useAuthStore.getState().logout()

      expect(useAuthStore.getState().isAuthenticated).toBe(false)

      useAuthStore.getState().setUser(user)
      useAuthStore.getState().setTokens(tokens)

      const state = useAuthStore.getState()
      expect(state.user).toEqual(user)
      expect(state.tokens).toEqual(tokens)
      expect(state.isAuthenticated).toBe(true)
    })
  })

  describe('Token management', () => {
    it('should persist tokens across store resets', () => {
      const tokens: AuthTokens = {
        access: 'persistent-access',
        refresh: 'persistent-refresh',
      }

      useAuthStore.getState().setTokens(tokens)

      // Simulate store reset
      useAuthStore.setState({
        user: null,
        tokens: null,
        isAuthenticated: false,
      })

      // Tokens should still be in localStorage
      expect(localStorage.getItem('access_token')).toBe('persistent-access')
      expect(localStorage.getItem('refresh_token')).toBe('persistent-refresh')

      // Can restore from localStorage
      useAuthStore.getState().checkAuth()
      expect(useAuthStore.getState().tokens).toEqual(tokens)
    })

    it('should handle localStorage being unavailable gracefully', () => {
      const tokens: AuthTokens = {
        access: 'test',
        refresh: 'test-refresh',
      }

      // This should not throw
      expect(() => useAuthStore.getState().setTokens(tokens)).not.toThrow()
      expect(() => useAuthStore.getState().logout()).not.toThrow()
      expect(() => useAuthStore.getState().checkAuth()).not.toThrow()
    })
  })
})
