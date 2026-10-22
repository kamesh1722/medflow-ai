import { connectDatabase, databaseReady } from '../config/database.js'
import { jwtSecretReady } from '../config/runtime.js'

export async function databaseAvailable(req, res, next) {
  if (!jwtSecretReady()) {
    return res.status(503).json({ message: 'Authentication is not configured on the server.' })
  }
  await connectDatabase()
  if (!databaseReady()) {
    return res.status(503).json({ message: 'The inventory database is unavailable. Check the backend MONGODB_URI configuration.' })
  }
  next()
}
