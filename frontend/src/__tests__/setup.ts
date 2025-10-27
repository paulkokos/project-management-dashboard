import { afterEach, vi, beforeEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

// Polyfill for webidl-conversions compatibility
if (typeof Symbol !== 'undefined' && !Symbol.asyncIterator) {
  Object.defineProperty(Symbol, 'asyncIterator', {
    value: Symbol.for('Symbol.asyncIterator'),
  })
}

// Mock the search API globally so it can be imported by multiple modules
vi.mock('@/services/search.api', () => ({
  searchAPI: {
    search: vi.fn(),
    autocomplete: vi.fn(),
  },
}))

// Also mock the barrel export since Search.tsx imports from @/services
vi.mock('@/services', async () => {
  // Get the mocked search.api module
  const { searchAPI } = await vi.importMock('@/services/search.api')
  // Import all other services
  const actual = await vi.importActual('@/services')
  return {
    ...actual,
    searchAPI,
  }
})

// Cleanup after each test
afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.clearAllMocks()
})

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
})

// Mock localStorage with actual storage
const store = new Map<string, string>()

const localStorageMock: Storage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => store.set(key, value),
  removeItem: (key: string) => store.delete(key),
  clear: () => store.clear(),
  key: (index: number) => {
    const keys = Array.from(store.keys())
    return keys[index] ?? null
  },
  get length() {
    return store.size
  },
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})
global.localStorage = localStorageMock

// Mock environment variables
vi.stubGlobal('import', {
  meta: {
    env: {
      VITE_API_BASE_URL: 'http://localhost:8000/api',
    },
  },
})
