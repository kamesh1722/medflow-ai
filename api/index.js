import app from '../backend/src/app.js'

// Vercel rewrites /api/<path> to this concrete function and adds <path> as a
// query parameter. Restore the public API URL before passing the request to
// Express so the existing routers continue to handle /api/auth and /api/medicines.
export default function handler(req, res) {
  const incoming = new URL(req.url || '/', 'http://vercel.local')
  let apiPath = incoming.searchParams.get('path')

  // Vercel normally passes the wildcard portion (for example, "health").
  // Some routing paths can include the public prefix as well, so accept that
  // form and direct function URLs without making Express receive /api/api/… .
  if (!apiPath && incoming.pathname !== '/api/index') {
    apiPath = incoming.pathname.replace(/^\/api\//, '')
  }
  apiPath = apiPath?.replace(/^\/?api\//, '')
  const segments = apiPath?.split('/')

  if (!segments?.length || segments.some(segment => !segment || segment === '.' || segment === '..')) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ message: 'A valid API path is required.' }))
    return
  }

  incoming.searchParams.delete('path')
  const query = incoming.searchParams.toString()
  req.url = `/api/${segments.map(segment => encodeURIComponent(segment)).join('/')}${query ? `?${query}` : ''}`
  return app(req, res)
}
