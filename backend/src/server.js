import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { fileURLToPath } from 'node:url'
import { connectDatabase } from './config/database.js'

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) })

// Import the app only after local .env values have been loaded.
const { default: app } = await import('./app.js')
const port = Number(process.env.PORT) || 5000
const server = app.listen(port, () => {
  console.info(`MedFlow API listening on port ${port}.`)
  void connectDatabase()
})

function shutdown(signal) {
  console.info(`${signal} received. Closing MedFlow API.`)
  server.close(() => {
    void mongoose.disconnect().finally(() => process.exit(0))
  })
  setTimeout(() => process.exit(1), 10000).unref()
}

process.once('SIGINT', () => shutdown('SIGINT'))
process.once('SIGTERM', () => shutdown('SIGTERM'))
