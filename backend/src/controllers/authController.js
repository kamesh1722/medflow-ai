import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import Admin from '../models/Admin.js'
import { cookieName } from '../middleware/requireAdmin.js'

const dummyPasswordHash = bcrypt.hashSync('medflow-invalid-account-check', 12)

const cookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api',
  maxAge,
})

function publicAdmin(admin) {
  return { id: admin.id, email: admin.email, role: admin.role }
}

export async function login(req, res, next) {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
    const password = typeof req.body?.password === 'string' ? req.body.password : ''
    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length > 256) {
      return res.status(400).json({ message: 'Enter a valid email address and password.' })
    }

    const admin = await Admin.findOne({ email }).select('+passwordHash +tokenVersion')
    const passwordMatches = await bcrypt.compare(password, admin?.passwordHash || dummyPasswordHash)
    if (!admin || !passwordMatches) return res.status(401).json({ message: 'Invalid email or password.' })

    const remember = req.body?.remember === true
    const expiresIn = remember ? '8h' : '30m'
    const maxAge = remember ? 8 * 60 * 60 * 1000 : 30 * 60 * 1000
    const token = jwt.sign({ sub: admin.id, role: admin.role, ver: admin.tokenVersion }, process.env.JWT_SECRET, {
      algorithm: 'HS256', expiresIn, issuer: 'medflow-api', audience: 'medflow-admin',
    })
    res.cookie(cookieName, token, cookieOptions(maxAge))
    res.json({ user: publicAdmin(admin) })
  } catch (error) { next(error) }
}

export async function currentAdmin(req, res) {
  res.json({ user: req.admin })
}

export async function changePassword(req, res, next) {
  try {
    const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : ''
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : ''
    if (!currentPassword || currentPassword.length > 256) {
      return res.status(400).json({ message: 'Enter your current password.' })
    }
    if (newPassword.length !== 4 || Buffer.byteLength(newPassword, 'utf8') > 72) {
      return res.status(400).json({ message: 'Your password must be exactly 4 characters.' })
    }

    const admin = await Admin.findById(req.admin.id).select('+passwordHash +tokenVersion')
    if (!admin) return res.status(401).json({ message: 'Your administrator session is no longer valid.' })
    if (!await bcrypt.compare(currentPassword, admin.passwordHash)) {
      return res.status(401).json({ message: 'Your current password is incorrect.' })
    }
    if (await bcrypt.compare(newPassword, admin.passwordHash)) {
      return res.status(400).json({ message: 'Choose a new password that differs from your current password.' })
    }

    const passwordHash = await bcrypt.hash(newPassword, 12)
    const updatedAdmin = await Admin.findByIdAndUpdate(admin.id, {
      $set: { passwordHash },
      $inc: { tokenVersion: 1 },
    })
    if (!updatedAdmin) return res.status(401).json({ message: 'Your administrator account is no longer available.' })
    res.clearCookie(cookieName, cookieOptions(0))
    res.json({ message: 'Password changed successfully. Sign in again with your new password.' })
  } catch (error) { next(error) }
}

export async function logout(req, res, next) {
  try {
    const admin = await Admin.findByIdAndUpdate(req.admin.id, { $inc: { tokenVersion: 1 } })
    res.clearCookie(cookieName, cookieOptions(0))
    if (!admin) return res.status(401).json({ message: 'The administrator session is no longer valid.' })
    res.json({ message: 'Signed out.' })
  } catch (error) { next(error) }
}
