import axios from 'axios'

// Future REST integration point. Demo mode never silently substitutes data after request failures.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 12000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  response => response,
  error => {
    const loginPath = import.meta.env.VITE_AUTH_LOGIN_PATH?.trim() || '/auth/login'
    const sessionPath = import.meta.env.VITE_AUTH_SESSION_PATH?.trim() || '/auth/me'
    const isAuthRequest = error.config?.url?.includes(loginPath) || error.config?.url?.includes(sessionPath)
    if (error.response?.status === 401 && !isAuthRequest && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('medflow:session-expired'))
    }
    return Promise.reject(error)
  },
)

export const apiErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || 'The request could not be completed.'
