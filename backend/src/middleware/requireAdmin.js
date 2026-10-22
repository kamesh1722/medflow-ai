import jwt from 'jsonwebtoken'
import Admin from '../models/Admin.js'

const cookieName = 'medflow_admin'

export async function requireAdmin(req, res, next) {
  const token = req.cookies?.[cookieName]
  if (!token) return res.status(401).json({ message: 'Authentication required.' })
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'], issuer: 'medflow-api', audience: 'medflow-admin' })
    const admin = await Admin.findById(payload.sub).select('+tokenVersion')
    if (!admin || admin.role !== 'admin' || admin.tokenVersion !== payload.ver) {
      return res.status(401).json({ message: 'Your session has expired. Please sign in again.' })
    }
    req.admin = { id: admin.id, email: admin.email, role: admin.role }
    next()
  } catch {
    return res.status(401).json({ message: 'Your session has expired. Please sign in again.' })
  }
}

export { cookieName }
