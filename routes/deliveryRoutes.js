const express = require('express');
const mongoose = require('mongoose');
const FoodOrder = require('../models/FoodOrder');
const DeliveryTask = require('../models/DeliveryTask');
const DeliveryReport = require('../models/DeliveryReport');
const { requireAuth, requireDelivery } = require('../middleware/auth');
const router = express.Router();

router.use(requireAuth, requireDelivery);

const statusToLegacy = status => ({
  placed: 'PLACED', accepted: 'CONFIRMED', confirmed: 'CONFIRMED',
  preparing: 'PREPARING', ready_for_pickup: 'READY_FOR_PICKUP',
  out_for_delivery: 'OUT_FOR_DELIVERY', delivered: 'DELIVERED',
  cancelled: 'CANCELLED', rejected: 'CANCELLED'
}[String(status || '').toLowerCase()] || 'PLACED');

function presentTask(task) {
  const order = task.order || {};
  const address = order.deliveryAddress || {};
  let officialStatus = statusToLegacy(order.orderStatus);
  if (task.status === 'picked_up') officialStatus = 'PICKED_UP';
  if (task.status === 'en_route') officialStatus = 'OUT_FOR_DELIVERY';
  if (task.status === 'delivered') officialStatus = 'DELIVERED';
  return {
    _id: String(task._id),
    orderId: String(order._id || task.order),
    assignmentId: task.assignmentId || '',
    orderNumber: order.orderNumber || ('GC-' + String(order._id || task.order).slice(-8).toUpperCase()),
    customer: {
      name: address.fullName || 'Customer',
      phone: address.phone || '',
      address: [address.addressLine, address.area, address.city, address.state, address.postalCode].filter(Boolean).join(', '),
      instructions: address.instructions || ''
    },
    items: (order.items || []).map(item => ({ name: item.name, quantity: item.quantity, price: item.unitPrice })),
    total: order.total || 0,
    paymentMethod: order.paymentMethod || 'Payment',
    paymentStatus: order.paymentStatus || 'Unknown',
    officialStatus,
    taskStatus: task.status,
    acceptedAt: task.acceptedAt,
    createdAt: order.createdAt || task.createdAt
  };
}

router.get('/', async (req, res, next) => {
  try {
    const tasks = await DeliveryTask.find({
      deliveryPerson: req.session.user.id,
      status: { $in: ['assigned', 'accepted', 'at_restaurant', 'picked_up', 'en_route', 'delivery_failed'] }
    }).sort({ updatedAt: -1 }).populate('order').limit(100).lean();
    const orders = tasks.map(presentTask);
    const reports = await DeliveryReport.find({ deliveryBoy: req.session.user.id })
      .sort({ createdAt: -1 }).limit(10).populate('order', 'orderNumber').lean();
    const stats = {
      assigned: tasks.filter(t => ['assigned', 'accepted', 'at_restaurant'].includes(t.status)).length,
      active: tasks.filter(t => ['picked_up', 'en_route'].includes(t.status)).length,
      pending: reports.filter(r => r.verificationStatus === 'PENDING').length,
      completed: reports.filter(r => r.verificationStatus === 'APPROVED' && r.result === 'DELIVERED').length
    };
    res.render('delivery/dashboard', { orders, reports, stats, user: req.session.user, notice: req.query.notice || null });
  } catch (err) { next(err); }
});

router.post('/orders/:id/accept', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.redirect('/delivery?notice=order-unavailable');
    const task = await DeliveryTask.findOne({ _id: req.params.id, deliveryPerson: req.session.user.id, status: 'assigned' });
    if (!task) return res.redirect('/delivery?notice=order-unavailable');
    task.status = 'accepted';
    task.acceptedAt = new Date();
    task.events.push({ status: 'accepted', actorId: req.session.user.id, actorRole: 'delivery', note: 'Agent accepted assignment.' });
    await task.save();
    res.redirect('/delivery?notice=accepted');
  } catch (err) { next(err); }
});

router.post('/orders/:id/reject', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.redirect('/delivery?notice=order-unavailable');
    const task = await DeliveryTask.findOne({ _id: req.params.id, deliveryPerson: req.session.user.id, status: 'assigned' });
    if (!task) return res.redirect('/delivery?notice=order-unavailable');
    task.status = 'assignment_failed';
    task.failureReason = String(req.body.reason || 'Agent declined assignment.').trim().slice(0, 500);
    task.deliveryPerson = null;
    task.events.push({ status: 'assignment_failed', actorId: req.session.user.id, actorRole: 'delivery', note: task.failureReason });
    await task.save();
    res.redirect('/delivery?notice=assignment-released');
  } catch (err) { next(err); }
});

router.post('/orders/:id/pickup', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.redirect('/delivery?notice=order-unavailable');
    const task = await DeliveryTask.findOne({
      _id: req.params.id, deliveryPerson: req.session.user.id, status: { $in: ['accepted', 'at_restaurant'] }
    });
    if (!task) return res.redirect('/delivery?notice=order-unavailable');
    task.status = 'picked_up';
    task.pickedUpAt = new Date();
    task.events.push({ status: 'picked_up', actorId: req.session.user.id, actorRole: 'delivery', note: 'Agent confirmed pickup.' });
    await task.save();
    res.redirect('/delivery?notice=picked-up');
  } catch (err) { next(err); }
});

router.post('/orders/:id/report', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.redirect('/delivery?notice=order-unavailable');
    const task = await DeliveryTask.findOne({
      _id: req.params.id, deliveryPerson: req.session.user.id, status: 'en_route'
    });
    if (!task) return res.redirect('/delivery?notice=order-unavailable');
    const result = String(req.body.result || '');
    if (!['DELIVERED', 'UNABLE_TO_DELIVER'].includes(result)) return res.redirect('/delivery?notice=invalid-report');
    const pending = await DeliveryReport.findOne({ order: task.order, deliveryBoy: req.session.user.id, verificationStatus: 'PENDING' });
    if (pending) return res.redirect('/delivery?notice=report-pending');
    await DeliveryReport.create({
      order: task.order, deliveryBoy: req.session.user.id, result,
      customerOtp: String(req.body.customerOtp || '').trim().slice(0, 8),
      proofNote: String(req.body.proofNote || '').trim().slice(0, 1000)
    });
    task.events.push({ status: 'agent_report_submitted', actorId: req.session.user.id, actorRole: 'delivery', note: result });
    await task.save();
    res.redirect('/delivery?notice=report-submitted');
  } catch (err) { next(err); }
});

router.get('/history', async (req, res, next) => {
  try {
    const reports = await DeliveryReport.find({ deliveryBoy: req.session.user.id })
      .sort({ createdAt: -1 }).populate('order', 'orderNumber').lean();
    res.render('delivery/history', { reports, user: req.session.user });
  } catch (err) { next(err); }
});

module.exports = router;
