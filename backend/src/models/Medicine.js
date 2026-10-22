import mongoose from 'mongoose'

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 1, maxlength: 160 },
  category: { type: String, required: true, trim: true, minlength: 1, maxlength: 80 },
  quantity: { type: Number, required: true, min: 0, validate: Number.isInteger },
  minimumStock: { type: Number, required: true, min: 0, validate: Number.isInteger },
  expiryDate: { type: Date, default: null },
  supplier: { type: String, trim: true, maxlength: 160, default: '' },
  batch: { type: String, trim: true, maxlength: 80, default: '' },
}, { timestamps: true, versionKey: false, strict: 'throw' })

medicineSchema.index({ name: 1 })
medicineSchema.index({ expiryDate: 1 })

export default mongoose.model('Medicine', medicineSchema)
