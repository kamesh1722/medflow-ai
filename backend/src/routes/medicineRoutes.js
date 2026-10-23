import { Router } from 'express'
import { createMedicine, deleteMedicine, getMedicine, listMedicines, updateMedicine } from '../controllers/medicineController.js'
import { inventoryDatabaseAvailable } from '../middleware/inventoryDatabaseAvailable.js'

const router = Router()
router.use(inventoryDatabaseAvailable)
router.get('/', listMedicines)
router.get('/:id', getMedicine)
router.post('/', createMedicine)
router.put('/:id', updateMedicine)
router.patch('/:id', updateMedicine)
router.delete('/:id', deleteMedicine)

export default router
