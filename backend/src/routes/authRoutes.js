import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { changePassword, currentAdmin, login, logout } from '../controllers/authController.js'
import { databaseAvailable } from '../middleware/databaseAvailable.js'
import { requireAdmin } from '../middleware/requireAdmin.js'

const router = Router()
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many sign-in attempts. Wait a few minutes and try again.' },
})

router.post('/login', loginLimiter, databaseAvailable, login)
router.get('/me', databaseAvailable, requireAdmin, currentAdmin)
router.post('/change-password', databaseAvailable, requireAdmin, changePassword)
router.post('/logout', databaseAvailable, requireAdmin, logout)

export default router
