import { databaseReady } from '../config/database.js'

export function databaseAvailable(req, res, next) {
  if (!databaseReady()) {
    return res.status(503).json({ message: 'The inventory database is unavailable. Start MongoDB and check the backend MONGODB_URI.' })
  }
  next()
}
