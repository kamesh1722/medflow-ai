import mongoose from 'mongoose'

let retryTimer

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/medflow_ai'
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 })
    console.info('MongoDB connected.')
    return true
  } catch {
    console.error('MongoDB connection failed. Check that MongoDB is running and MONGODB_URI is correct.')
    clearTimeout(retryTimer)
    retryTimer = setTimeout(connectDatabase, 10000)
    retryTimer.unref?.()
    return false
  }
}

export function databaseReady() {
  return mongoose.connection.readyState === 1
}

mongoose.connection.on('disconnected', () => {
  console.error('MongoDB disconnected. The API will report database unavailable until connection is restored.')
})
