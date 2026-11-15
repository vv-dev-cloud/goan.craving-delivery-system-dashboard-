const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  status: { type: String, required: true },
  actorId: { type: mongoose.Schema.Types.ObjectId, default: null },
  actorRole: { type: String, enum: ['seller', 'delivery', 'admin', 'system', 'employee'], default: 'system' },
  note: { type: String, maxlength: 500, default: '' },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const taskSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodOrder', required: true, unique: true, index: true },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  deliveryPerson: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  assignmentId: { type: String, unique: true, index: true, sparse: true },
  status: {
    type: String,
    enum: ['pending_assignment', 'assigned', 'accepted', 'at_restaurant', 'picked_up', 'en_route', 'delivered', 'assignment_failed', 'delivery_failed', 'cancelled', 'returned'],
    default: 'pending_assignment',
    index: true
  },
  pickup: { address: { type: String, default: '' }, latitude: Number, longitude: Number },
  dropoff: { address: { type: String, default: '' }, latitude: Number, longitude: Number },
  assignedAt: Date,
  acceptedAt: Date,
  pickedUpAt: Date,
  deliveredAt: Date,
  attemptCount: { type: Number, default: 0 },
  failureReason: { type: String, maxlength: 500, default: '' },
  events: { type: [eventSchema], default: [] }
}, { timestamps: true, collection: 'deliverytasks' });

module.exports = mongoose.models.DeliveryTask || mongoose.model('DeliveryTask', taskSchema, 'deliverytasks');
