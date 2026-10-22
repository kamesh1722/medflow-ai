import mongoose from 'mongoose'
import { isProductionRuntime } from './runtime.js'

let connectionPromise

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
    .catch(() => {
      // Never log the URI: it may contain database credentials.
      console.error('MongoDB connection failed. Check MongoDB availability and the MONGODB_URI setting.')
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
