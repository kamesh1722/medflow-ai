import mongoose from 'mongoose'

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254, index: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin'], default: 'admin', required: true },
  tokenVersion: { type: Number, default: 0, select: false },
}, { timestamps: true, versionKey: false })

export default mongoose.model('Admin', adminSchema)
