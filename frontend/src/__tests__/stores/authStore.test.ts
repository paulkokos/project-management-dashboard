import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/stores/authStore';

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      tokens: null,
      isAuthenticated: false,
    });
    localStorage.clear();
  });

  it('should initialize with null user and tokens', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.tokens).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('should set tokens correctly', () => {
    const tokens = {
      access: 'test-access-token',
      refresh: 'test-refresh-token',
    };
    useAuthStore.getState().setTokens(tokens);

    const state = useAuthStore.getState();
    expect(state.tokens).toEqual(tokens);
  });

  it('should set user correctly', () => {
    const user = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
    };
    useAuthStore.getState().setUser(user);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(user);
    expect(state.isAuthenticated).toBe(true);
  });

  it('should update isAuthenticated when user is set', () => {
    const user = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
    };
    useAuthStore.getState().setUser(user);

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('should logout and clear all data', () => {
    // Setup
    useAuthStore.getState().setTokens({
      access: 'token',
      refresh: 'refresh',
    });
    useAuthStore.getState().setUser({
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
    });

    // Logout
    useAuthStore.getState().logout();

    // Verify
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.tokens).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
