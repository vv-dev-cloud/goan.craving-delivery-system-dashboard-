const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, index: true },
  customer: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    instructions: String
  },
  items: [{ name: String, quantity: Number, price: Number }],
  total: { type: Number, default: 0 },
  paymentMethod: String,
  paymentStatus: { type: String, default: 'UNKNOWN' },
  assignedDeliveryBoy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  officialStatus: {
    type: String,
    enum: ['PLACED', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'DELIVERY_FAILED'],
    default: 'PLACED',
    index: true
  },
  acceptedAt: Date,
  pickedUpAt: Date,
  dispatchedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);