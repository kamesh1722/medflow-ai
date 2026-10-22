import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { after, before, test } from 'node:test'

// Exercise the missing-configuration behavior without touching local MongoDB
// or loading any developer credentials.
process.env.VERCEL = '1'
process.env.NODE_ENV = 'production'
delete process.env.MONGODB_URI
delete process.env.JWT_SECRET

const { default: handler } = await import('../../api/index.js')
const server = createServer(handler)
let origin

before(async () => {
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  origin = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  await new Promise(resolve => server.close(resolve))
})

test('Vercel installs frontend build tools and orders API rewrite before SPA fallback', async () => {
  const config = JSON.parse(await readFile(new URL('../../vercel.json', import.meta.url), 'utf8'))
  assert.match(config.installCommand, /^npm ci --include=dev\b/)
  assert.equal(config.buildCommand, 'npm run build')
  assert.equal(config.outputDirectory, 'dist')
  assert.equal(config.rewrites[0].source, '/api/:path*')
  assert.equal(config.rewrites[0].destination, '/api/index?path=:path*')
  assert.equal(config.rewrites[1].destination, '/index.html')
})

test('GET health reaches Express and returns a safe unavailable response without MongoDB config', async () => {
  const response = await fetch(`${origin}/api/index?path=health`)
  assert.equal(response.status, 503)
  assert.match(response.headers.get('content-type') || '', /application\/json/)
  assert.deepEqual(await response.json(), {
    status: 'service_unavailable',
    configuration: { authentication: false },
    database: { connected: false, readyState: 0 },
  })
})

test('GET health also handles a rewritten path that includes the /api prefix', async () => {
  const response = await fetch(`${origin}/api/index?path=api%2Fhealth`)
  assert.equal(response.status, 503)
  assert.deepEqual(await response.json(), {
    status: 'service_unavailable',
    configuration: { authentication: false },
    database: { connected: false, readyState: 0 },
  })
})

test('POST login reaches the real auth route and does not fake success without configuration', async () => {
  const response = await fetch(`${origin}/api/index?path=auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.invalid', password: 'not-a-real-password' }),
  })
  assert.equal(response.status, 503)
  assert.match(response.headers.get('content-type') || '', /application\/json/)
  assert.deepEqual(await response.json(), { message: 'Authentication is not configured on the server.' })
})

test('an invalid API path returns JSON rather than frontend HTML', async () => {
  const response = await fetch(`${origin}/api/index`)
  assert.equal(response.status, 400)
  assert.match(response.headers.get('content-type') || '', /application\/json/)
})
