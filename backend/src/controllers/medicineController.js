import mongoose from 'mongoose'
import Medicine from '../models/Medicine.js'

const fields = ['name', 'category', 'quantity', 'minimumStock', 'expiryDate', 'supplier', 'batch']

function medicineInput(body, partial = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'Submit a medicine object.' }
  const unknown = Object.keys(body).filter(key => !fields.includes(key))
  if (unknown.length) return { error: 'The request contains unsupported medicine fields.' }
  const values = {}
  for (const field of fields) {
    if (!(field in body)) continue
    const value = body[field]
    if (field === 'quantity' || field === 'minimumStock') {
      if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 100000000) return { error: `${field} must be a non-negative whole number.` }
      values[field] = value
    } else if (field === 'expiryDate') {
      if (value === null || value === '') values[field] = null
      else {
        if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return { error: 'expiryDate must use YYYY-MM-DD format.' }
        const date = new Date(`${value}T00:00:00.000Z`)
        if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return { error: 'expiryDate is not a valid calendar date.' }
        values[field] = date
      }
    } else {
      if (typeof value !== 'string') return { error: `${field} must be text.` }
      const clean = value.trim()
      const max = field === 'name' ? 160 : field === 'category' ? 80 : field === 'supplier' ? 160 : 80
      if (clean.length > max || (!partial && ['name', 'category'].includes(field) && !clean)) return { error: `${field} is required and must be no more than ${max} characters.` }
      values[field] = clean
    }
  }
  if (!partial && (!('name' in values) || !('category' in values) || !('quantity' in values) || !('minimumStock' in values))) {
    return { error: 'Name, category, quantity, and minimumStock are required.' }
  }
  return { values }
}

export async function listMedicines(req, res, next) {
  try {
    const medicines = await Medicine.find().sort({ name: 1 }).lean()
    res.json({ medicines })
  } catch (error) { next(error) }
}

export async function getMedicine(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid medicine ID.' })
  try {
    const medicine = await Medicine.findById(req.params.id).lean()
    if (!medicine) return res.status(404).json({ message: 'Medicine record not found.' })
    res.json({ medicine })
  } catch (error) { next(error) }
}

export async function createMedicine(req, res, next) {
  const parsed = medicineInput(req.body)
  if (parsed.error) return res.status(400).json({ message: parsed.error })
  try {
    const medicine = await Medicine.create(parsed.values)
    res.status(201).json({ medicine })
  } catch (error) { next(error) }
}

export async function updateMedicine(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid medicine ID.' })
  const parsed = medicineInput(req.body, true)
  if (parsed.error) return res.status(400).json({ message: parsed.error })
  if (!Object.keys(parsed.values).length) return res.status(400).json({ message: 'Provide at least one supported field to update.' })
  try {
    const medicine = await Medicine.findByIdAndUpdate(req.params.id, parsed.values, { new: true, runValidators: true, context: 'query' }).lean()
    if (!medicine) return res.status(404).json({ message: 'Medicine record not found.' })
    res.json({ medicine })
  } catch (error) { next(error) }
}

export async function deleteMedicine(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid medicine ID.' })
  try {
    const medicine = await Medicine.findByIdAndDelete(req.params.id)
    if (!medicine) return res.status(404).json({ message: 'Medicine record not found.' })
    res.json({ message: 'Medicine record deleted.' })
  } catch (error) { next(error) }
}
