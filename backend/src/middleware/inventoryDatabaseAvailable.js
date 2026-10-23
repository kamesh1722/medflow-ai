import { connectDatabase, databaseReady } from '../config/database.js'

export async function inventoryDatabaseAvailable(req, res, next) {
  await connectDatabase()
  if (!databaseReady()) {
    return res.status(503).json({ message: 'The inventory database is unavailable. Check the backend MONGODB_URI configuration.' })
  }
  next()
}
