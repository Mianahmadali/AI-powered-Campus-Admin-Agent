import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      // Clear token from storage
      localStorage.removeItem('token')
      
      // Only redirect if we're not already on login/signup pages
      const currentPath = window.location.pathname
      if (currentPath !== '/login' && currentPath !== '/signup') {
        window.location.href = '/login'
      }
    }
    
    return Promise.reject(error)
  }
)

// Helper function to set auth token
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token)
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    localStorage.removeItem('token')
    delete api.defaults.headers.common['Authorization']
  }
}

// Helper function to get auth token
export const getAuthToken = () => {
  return localStorage.getItem('token')
}

// Helper function to check if user is authenticated
export const isAuthenticated = () => {
  const token = getAuthToken()
  if (!token) return false
  
  try {
    // Basic JWT structure check (you could add expiration check here)
    const payload = JSON.parse(atob(token.split('.')[1]))
    const currentTime = Math.floor(Date.now() / 1000)
    return payload.exp > currentTime
  } catch (error) {
    return false
  }
}
