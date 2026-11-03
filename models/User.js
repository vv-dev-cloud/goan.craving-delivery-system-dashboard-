const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  agentId: { type: String, unique: true, sparse: true, uppercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['delivery', 'employee', 'admin'], default: 'delivery', index: true },
  isActive: { type: Boolean, default: true },
  phone: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
