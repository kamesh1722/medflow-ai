import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { after, before, test } from 'node:test'

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

test('inventory API reaches the database check without requiring a login session', async () => {
  const response = await fetch(`${origin}/api/index?path=medicines`)
  assert.equal(response.status, 503)
  assert.deepEqual(await response.json(), {
    message: 'The inventory database is unavailable. Check the backend MONGODB_URI configuration.',
  })
})
