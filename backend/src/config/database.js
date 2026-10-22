import mongoose from 'mongoose'
import { isProductionRuntime } from './runtime.js'

let connectionPromise

export function classifyMongoConnectionError(error) {
  const chain = []
  let current = error
  for (let depth = 0; current && depth < 4; depth += 1, current = current.cause) chain.push(current)

  const codes = chain.map(item => item?.code)
  const names = chain.map(item => item?.name)

  if (names.includes('MongoParseError') || codes.includes('ERR_INVALID_URL')) return 'invalid_connection_string'
  if (codes.some(code => code === 18 || code === 8000)) return 'atlas_authentication_rejected'
  if (codes.some(code => ['ENOTFOUND', 'EAI_AGAIN'].includes(code))) return 'dns_lookup_failed'
  if (codes.some(code => ['ETIMEDOUT', 'ECONNREFUSED', 'ECONNRESET', 'ENETUNREACH', 'EHOSTUNREACH'].includes(code))) {
    return 'network_connection_failed'
  }
  if (names.includes('MongoServerSelectionError')) return 'atlas_server_unavailable_or_blocked'
  if (names.includes('MongoNetworkError')) return 'network_connection_failed'
  return 'connection_failed'
}

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) return true
  if (connectionPromise) return connectionPromise

  const uri = process.env.MONGODB_URI || (isProductionRuntime() ? '' : 'mongodb://127.0.0.1:27017/medflow_ai')
  if (!uri) {
    console.error('MongoDB is not configured. Set MONGODB_URI in the deployment environment.')
    return false
  }

  connectionPromise = mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
    .then(() => {
      console.info('MongoDB connected.')
      return true
    })
    .catch(error => {
      // Log only a safe category. Driver messages can contain host or URI details.
      console.error(`MongoDB connection failed (${classifyMongoConnectionError(error)}).`)
      return false
    })
    .finally(() => { connectionPromise = undefined })

  return connectionPromise
}

export function databaseReady() {
  return mongoose.connection.readyState === 1
}

mongoose.connection.on('disconnected', () => {
  console.error('MongoDB disconnected. The API will report database unavailable until connection is restored.')
})

mongoose.connection.on('error', error => {
  console.error(`MongoDB connection error (${classifyMongoConnectionError(error)}).`)
})
