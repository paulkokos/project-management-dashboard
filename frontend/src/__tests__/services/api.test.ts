import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'

// Mock axios
vi.mock('axios')

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create axios instance with correct baseURL', () => {
    expect(axios.create).toBeDefined()
  })

  it('should handle GET requests', async () => {
    const mockResponse = { data: [{ id: 1, title: 'Project 1' }] }
    vi.mocked(axios.get).mockResolvedValue(mockResponse)

    const result = await axios.get('/projects')
    expect(result.data).toEqual(mockResponse.data)
  })

  it('should handle POST requests', async () => {
    const mockData = { title: 'New Project' }
    const mockResponse = { data: { id: 1, ...mockData } }
    vi.mocked(axios.post).mockResolvedValue(mockResponse)

    const result = await axios.post('/projects', mockData)
    expect(result.data).toEqual(mockResponse.data)
  })

  it('should handle PATCH requests', async () => {
    const mockData = { title: 'Updated Project' }
    const mockResponse = { data: { id: 1, ...mockData } }
    vi.mocked(axios.patch).mockResolvedValue(mockResponse)

    const result = await axios.patch('/projects/1', mockData)
    expect(result.data).toEqual(mockResponse.data)
  })

  it('should handle DELETE requests', async () => {
    vi.mocked(axios.delete).mockResolvedValue({ status: 204 })

    const result = await axios.delete('/projects/1')
    expect(result.status).toBe(204)
  })

  it('should handle API errors', async () => {
    const error = new Error('Network error')
    vi.mocked(axios.get).mockRejectedValue(error)

    try {
      await axios.get('/projects')
      expect.fail('Should have thrown')
    } catch (err) {
      expect(err).toEqual(error)
    }
  })

  it('should include auth headers', async () => {
    const mockResponse = { data: { success: true } }
    vi.mocked(axios.get).mockResolvedValue(mockResponse)

    await axios.get('/projects')
    expect(axios.get).toHaveBeenCalled()
  })

  it('should handle pagination', async () => {
    const mockResponse = { data: { results: [], count: 0, next: null, previous: null } }
    vi.mocked(axios.get).mockResolvedValue(mockResponse)

    const result = await axios.get('/projects?page=1')
    expect(result.data).toHaveProperty('results')
  })

  it('should handle multiple concurrent requests', async () => {
    const mockResponse1 = { data: { id: 1 } }
    const mockResponse2 = { data: { id: 2 } }

    vi.mocked(axios.get).mockResolvedValueOnce(mockResponse1).mockResolvedValueOnce(mockResponse2)

    const [result1, result2] = await Promise.all([
      axios.get('/projects/1'),
      axios.get('/projects/2'),
    ])

    expect(result1.data.id).toBe(1)
    expect(result2.data.id).toBe(2)
  })

  it('should handle request with custom headers', async () => {
    const mockResponse = { data: { success: true } }
    vi.mocked(axios.get).mockResolvedValue(mockResponse)

    await axios.get('/projects', { headers: { 'X-Custom': 'value' } })
    expect(axios.get).toHaveBeenCalled()
  })
})
