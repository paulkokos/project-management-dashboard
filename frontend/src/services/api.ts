import axios, { AxiosInstance, AxiosError } from 'axios'
import { useAuthStore } from '@/stores/authStore'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

// Request timeout configuration (ms)
const REQUEST_TIMEOUT = 30000 // 30 seconds
const RETRY_DELAY_MS = 1000
const MAX_RETRIES = 3

const api: AxiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: REQUEST_TIMEOUT,
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Helper function for exponential backoff retry
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const shouldRetry = (error: AxiosError): boolean => {
  // Retry on network errors and 5xx server errors
  if (!error.response) return true // Network error
  if (error.code === 'ECONNABORTED') return true // Timeout
  if (error.response.status >= 500) return true // Server error
  return false
}

// Response interceptor to handle 401 errors and retry logic
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any

    // Handle 401 Unauthorized - refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        const response = await axios.post(`${baseURL}/auth/token/refresh/`, {
          refresh: refreshToken,
        }, { timeout: REQUEST_TIMEOUT })

        const { access } = response.data
        localStorage.setItem('access_token', access)

        originalRequest.headers.Authorization = `Bearer ${access}`
        return api(originalRequest)
      } catch (err) {
        useAuthStore.getState().logout()
        return Promise.reject(err)
      }
    }

    // Retry logic for network errors and server errors
    if (shouldRetry(error as AxiosError) && !originalRequest._retryCount) {
      originalRequest._retryCount = 0
    }

    if (originalRequest._retryCount !== undefined && originalRequest._retryCount < MAX_RETRIES) {
      originalRequest._retryCount += 1
      const backoffTime = RETRY_DELAY_MS * Math.pow(2, originalRequest._retryCount - 1)

      await sleep(backoffTime)

      return api(originalRequest)
    }

    return Promise.reject(error)
  }
)

export default api
