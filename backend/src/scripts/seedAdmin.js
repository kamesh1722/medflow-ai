import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import Admin from '../models/Admin.js'

dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) })

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
const password = process.env.ADMIN_PASSWORD
const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/medflow_ai'

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || /example\.com|replace-with|change-me/i.test(email)) {
  console.error('Set ADMIN_EMAIL to a valid email address in backend/.env.')
  process.exit(1)
}
if (!password || password.length !== 4 || Buffer.byteLength(password, 'utf8') > 72 || /replace-with|your-password|change-me|example-password/i.test(password)) {
  console.error('Set ADMIN_PASSWORD to your chosen 4-character password in backend/.env.')
  process.exit(1)
}

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
  const existing = await Admin.findOne({ email }).select('_id')
  if (existing) {
    console.info('The configured administrator already exists. No account or password changes were made.')
  } else {
    const administratorExists = await Admin.exists({})
    if (administratorExists) {
      console.error('An administrator already exists with a different email. No account or password changes were made.')
      process.exitCode = 1
    } else {
      const passwordHash = await bcrypt.hash(password, 12)
      await Admin.create({ email, passwordHash, role: 'admin' })
      console.info('Initial administrator created. Credentials were not printed.')
    }
  }
} catch {
  console.error('Could not seed the administrator. Check MongoDB service and MONGODB_URI.')
  process.exitCode = 1
} finally {
  await mongoose.disconnect()
}
