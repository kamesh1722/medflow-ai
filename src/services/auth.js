import { api } from './api'

const loginPath = import.meta.env.VITE_AUTH_LOGIN_PATH?.trim() || '/auth/login'
const sessionPath = import.meta.env.VITE_AUTH_SESSION_PATH?.trim() || '/auth/me'
const logoutPath = import.meta.env.VITE_AUTH_LOGOUT_PATH?.trim() || '/auth/logout'
const changePasswordPath = import.meta.env.VITE_AUTH_CHANGE_PASSWORD_PATH?.trim() || '/auth/change-password'

export const authConfiguration = {
  login: Boolean(loginPath && sessionPath && logoutPath),
  session: Boolean(sessionPath),
  logout: Boolean(logoutPath),
}

function assertSecureProductionTransport() {
  if (import.meta.env.PROD && typeof window !== 'undefined') {
    const apiUrl = new URL(api.defaults.baseURL || '/', window.location.origin)
    if (window.location.protocol !== 'https:' || apiUrl.protocol !== 'https:') {
      throw new Error('Admin sign-in requires HTTPS in production. Check the frontend and API URLs.')
    }
  }
}

export async function signIn(email, password, remember = false) {
  if (!authConfiguration.login) throw new Error('Admin sign-in is not enabled. Configure login, session verification, and logout endpoints before using this page.')
  assertSecureProductionTransport()
  const { data } = await api.post(loginPath, { email, password, remember })
  if (!data?.user || typeof data.user !== 'object') {
    throw new Error('The authentication service returned an unexpected response. Expected a user session.')
  }
  return data.user
}

export async function restoreSession() {
  if (!authConfiguration.login) return null
  assertSecureProductionTransport()
  const { data } = await api.get(sessionPath)
  return data?.user && typeof data.user === 'object' ? data.user : null
}

export async function signOut() {
  if (!logoutPath) return
  assertSecureProductionTransport()
  await api.post(logoutPath)
}

export async function changePassword(currentPassword, newPassword) {
  assertSecureProductionTransport()
  const { data } = await api.post(changePasswordPath, { currentPassword, newPassword })
  return data
}
