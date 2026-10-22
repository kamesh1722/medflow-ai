import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import mongoose from 'mongoose'
import { connectDatabase, databaseReady } from './config/database.js'
import authRoutes from './routes/authRoutes.js'
import medicineRoutes from './routes/medicineRoutes.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'

const app = express()
dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) })
const port = Number(process.env.PORT) || 5000
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'

const jwtSecret = process.env.JWT_SECRET || ''
if (Buffer.byteLength(jwtSecret, 'utf8') < 32 || /replace-with|your-secret|change-me/i.test(jwtSecret)) {
  console.error('JWT_SECRET must be configured with at least 32 bytes. Set a random secret in backend/.env.')
  process.exit(1)
}

app.disable('x-powered-by')
app.use(helmet())
app.use(cors({
  origin(origin, callback) {
    if (!origin || origin === frontendOrigin) return callback(null, true)
    return callback(null, false)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}))
app.use(express.json({ limit: '32kb', strict: true }))
app.use(cookieParser())
app.use((req, res, next) => {
  const origin = req.get('origin')
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && origin && origin !== frontendOrigin) {
    return res.status(403).json({ message: 'This request origin is not allowed.' })
  }
  next()
})

app.get('/api/health', (req, res) => {
  const connected = databaseReady()
  res.status(connected ? 200 : 503).json({
    status: connected ? 'ok' : 'database_unavailable',
    database: { connected, readyState: mongoose.connection.readyState },
  })
})
app.use('/api/auth', authRoutes)
app.use('/api/medicines', medicineRoutes)
app.use(notFound)
app.use(errorHandler)

const server = app.listen(port, () => {
  console.info(`MedFlow API listening on port ${port}.`)
  void connectDatabase()
})

function shutdown(signal) {
  console.info(`${signal} received. Closing MedFlow API.`)
  server.close(() => {
    mongoose.disconnect().finally(() => process.exit(0))
  })
  setTimeout(() => process.exit(1), 10000).unref()
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
