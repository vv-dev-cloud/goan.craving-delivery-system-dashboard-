const mongoose = require('mongoose');

const deliveryReportSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  deliveryBoy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  result: { type: String, enum: ['DELIVERED', 'UNABLE_TO_DELIVER'], required: true },
  customerOtp: { type: String, select: false },
  proofNote: { type: String, maxlength: 1000 },
  verificationStatus: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'NEEDS_CLARIFICATION'],
    default: 'PENDING',
    index: true
  },
  employeeNote: String,
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('DeliveryReport', deliveryReportSchema);