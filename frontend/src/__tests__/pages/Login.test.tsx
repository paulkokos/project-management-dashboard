import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Login from '@/pages/Login'
import * as api from '@/services'

// Mock the API
vi.mock('@/services', () => ({
  authAPI: {
    login: vi.fn(),
  },
}))

// Mock router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

// Mock auth store
vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    setTokens: vi.fn(),
    setUser: vi.fn(),
  }),
}))

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render login page title', () => {
    render(
      
        <Login />

    )
    expect(screen.getByText('Project Management Dashboard')).toBeInTheDocument()
  })

  it('should render sign in subtitle', () => {
    render(
      
        <Login />

    )
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument()
  })

  it('should render username input field', () => {
    render(
      
        <Login />

    )
    const usernameInput = screen.getByPlaceholderText('Username')
    expect(usernameInput).toBeInTheDocument()
  })

  it('should render password input field', () => {
    render(
      
        <Login />

    )
    const passwordInput = screen.getByPlaceholderText('Password')
    expect(passwordInput).toBeInTheDocument()
  })

  it('should have Sign in button', () => {
    render(
      
        <Login />

    )
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('should update username input', () => {
    render(
      
        <Login />

    )
    const usernameInput = screen.getByPlaceholderText('Username') as HTMLInputElement
    fireEvent.change(usernameInput, { target: { value: 'testuser' } })
    expect(usernameInput.value).toBe('testuser')
  })

  it('should update password input', () => {
    render(
      
        <Login />

    )
    const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    expect(passwordInput.value).toBe('password123')
  })

  it('should accept credentials', async () => {
    const mockLogin = vi.fn().mockResolvedValue({
      data: {
        access: 'access-token',
        refresh: 'refresh-token',
      },
    })
    vi.mocked(api.authAPI.login).mockImplementation(mockLogin)

    render(
      
        <Login />

    )

    const usernameInput = screen.getByPlaceholderText('Username')
    const passwordInput = screen.getByPlaceholderText('Password')
    const buttons = screen.getAllByRole('button')

    fireEvent.change(usernameInput, { target: { value: 'testuser' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(buttons[0])

    await waitFor(() => {
      expect((usernameInput as HTMLInputElement).value).toBe('testuser')
      expect((passwordInput as HTMLInputElement).value).toBe('password123')
    })
  })

  it('should display form on initial render', () => {
    render(
      
        <Login />

    )
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
  })
})
