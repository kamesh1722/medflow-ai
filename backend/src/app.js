import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import mongoose from 'mongoose'
import { connectDatabase, databaseReady } from './config/database.js'
import { allowedFrontendOrigins, jwtSecretReady, isAllowedOrigin } from './config/runtime.js'
import authRoutes from './routes/authRoutes.js'
import medicineRoutes from './routes/medicineRoutes.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'

const app = express()

app.disable('x-powered-by')
app.set('trust proxy', 1)
app.use(helmet())
app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true)
    try {
      const explicitlyAllowed = allowedFrontendOrigins()
        .some(value => {
          try { return new URL(value).origin === new URL(origin).origin } catch { return false }
        })
      return callback(null, explicitlyAllowed)
    } catch {
      return callback(null, false)
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}))
app.use(express.json({ limit: '32kb', strict: true }))
app.use(cookieParser())
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && !isAllowedOrigin(req.get('origin'), req)) {
    return res.status(403).json({ message: 'This request origin is not allowed.' })
  }
  next()
})

app.get('/api/health', async (req, res) => {
  const connected = await connectDatabase()
  const configured = jwtSecretReady()
  const ready = connected && configured
  res.status(ready ? 200 : 503).json({
    status: ready ? 'ok' : 'service_unavailable',
    configuration: { authentication: configured },
    database: { connected: databaseReady(), readyState: mongoose.connection.readyState },
  })
})
app.use('/api/auth', authRoutes)
app.use('/api/medicines', medicineRoutes)
app.use(notFound)
app.use(errorHandler)

export default app
