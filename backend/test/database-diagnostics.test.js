import assert from 'node:assert/strict'
import { test } from 'node:test'
import { classifyMongoConnectionError } from '../src/config/database.js'

test('MongoDB diagnostics classify common connection failures without returning error details', () => {
  assert.equal(classifyMongoConnectionError({ name: 'MongoParseError', message: 'sensitive connection details' }), 'invalid_connection_string')
  assert.equal(classifyMongoConnectionError({ name: 'MongoServerError', code: 18, message: 'sensitive authentication details' }), 'atlas_authentication_rejected')
  assert.equal(classifyMongoConnectionError({ name: 'MongoServerSelectionError', cause: { code: 'ENOTFOUND', message: 'sensitive host details' } }), 'dns_lookup_failed')
  assert.equal(classifyMongoConnectionError({ name: 'MongoServerSelectionError', cause: { code: 'ETIMEDOUT' } }), 'network_connection_failed')
  assert.equal(classifyMongoConnectionError({ name: 'MongoServerSelectionError' }), 'atlas_server_unavailable_or_blocked')
  assert.equal(classifyMongoConnectionError({ name: 'Error', message: 'sensitive fallback details' }), 'connection_failed')
})
