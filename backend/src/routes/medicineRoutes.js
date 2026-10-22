import { Router } from 'express'
import { createMedicine, deleteMedicine, getMedicine, listMedicines, updateMedicine } from '../controllers/medicineController.js'
import { databaseAvailable } from '../middleware/databaseAvailable.js'
import { requireAdmin } from '../middleware/requireAdmin.js'

const router = Router()
router.use(databaseAvailable, requireAdmin)
router.get('/', listMedicines)
router.get('/:id', getMedicine)
router.post('/', createMedicine)
router.put('/:id', updateMedicine)
router.patch('/:id', updateMedicine)
router.delete('/:id', deleteMedicine)

export default router
