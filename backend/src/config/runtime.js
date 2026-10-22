export function jwtSecretReady() {
  const secret = process.env.JWT_SECRET || ''
  return Buffer.byteLength(secret, 'utf8') >= 32 && !/replace-with|your-secret|change-me/i.test(secret)
}

export function isProductionRuntime() {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
}

export function allowedFrontendOrigins() {
  const configured = process.env.FRONTEND_ORIGIN
    ?.split(',')
    .map(value => value.trim())
    .filter(Boolean)

  if (configured?.length) return configured
  return isProductionRuntime() ? [] : ['http://localhost:5173']
}

export function isAllowedOrigin(origin, req) {
  if (!origin) return true

  try {
    const parsedOrigin = new URL(origin)
    const expectedProtocol = (req.get('x-forwarded-proto') || req.protocol).split(',')[0].trim()
    const requestHost = req.get('host')
    const sameOrigin = parsedOrigin.host === requestHost && parsedOrigin.protocol === `${expectedProtocol}:`
    const configuredOrigin = allowedFrontendOrigins().some(value => {
      try { return new URL(value).origin === parsedOrigin.origin } catch { return false }
    })
    return sameOrigin || configuredOrigin
  } catch {
    return false
  }
}
