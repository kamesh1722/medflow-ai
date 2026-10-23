import axios from 'axios'

const apiBaseUrl = import.meta.env.PROD
  ? '/api'
  : import.meta.env.VITE_API_BASE_URL?.trim() || '/api'

// Future REST integration point. Demo mode never silently substitutes data after request failures.
export const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 12000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

export const apiErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || 'The request could not be completed.'
