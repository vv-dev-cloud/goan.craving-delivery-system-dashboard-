const mongoose = require('mongoose');

// Read-only view of the canonical customer-site collection.
const foodOrderSchema = new mongoose.Schema({}, { strict: false, collection: 'foodorders' });
module.exports = mongoose.models.FoodOrder || mongoose.model('FoodOrder', foodOrderSchema, 'foodorders');
