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
  let existing = await Admin.findOne({ email }).select('+passwordHash +tokenVersion')
  if (!existing) {
    const administrators = await Admin.find({}).select('+passwordHash +tokenVersion').limit(2)
    if (administrators.length === 1) existing = administrators[0]
    else if (administrators.length > 1) {
      console.error('Multiple administrator records exist and none matches ADMIN_EMAIL. No records were changed.')
      throw new Error('Ambiguous administrator records')
    }
  }

  if (existing) {
    const changes = {}
    if (existing.email !== email) changes.email = email
    if (existing.role !== 'admin') changes.role = 'admin'
    if (!await bcrypt.compare(password, existing.passwordHash)) changes.passwordHash = await bcrypt.hash(password, 12)

    if (Object.keys(changes).length) {
      await Admin.findByIdAndUpdate(existing.id, {
        $set: changes,
        $inc: { tokenVersion: 1 },
      }, { runValidators: true })
      console.info('Existing administrator synchronized. Password was hashed and active sessions were invalidated.')
    } else {
      console.info('The configured administrator is already synchronized. No changes were needed.')
    }
  } else {
    const passwordHash = await bcrypt.hash(password, 12)
    await Admin.create({ email, passwordHash, role: 'admin' })
    console.info('Initial administrator created. Credentials were not printed.')
  }
} catch {
  console.error('Could not seed the administrator. Check MongoDB service and MONGODB_URI.')
  process.exitCode = 1
} finally {
  await mongoose.disconnect()
}
