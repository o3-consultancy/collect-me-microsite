import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://homebase-api.neutralfuels.net/api'
const API_KEY = import.meta.env.VITE_API_KEY

// Public endpoints that don't need API key
const PUBLIC_ENDPOINTS = ['/health', '/qr/sign', '/qr/verify', '/auth/login']

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to conditionally add API key
apiClient.interceptors.request.use(
  config => {
    // Check if this is a public endpoint
    const isPublicEndpoint = PUBLIC_ENDPOINTS.some(endpoint =>
      config.url?.startsWith(endpoint)
    )

    // Add API key only for protected endpoints
    if (!isPublicEndpoint && API_KEY) {
      config.headers['x-api-key'] = API_KEY
    }

    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  response => response,
  error => {
    const message = error.response?.data?.detail || 'An error occurred'
    console.error('API Error:', message)
    return Promise.reject(error)
  }
)

export default apiClient
