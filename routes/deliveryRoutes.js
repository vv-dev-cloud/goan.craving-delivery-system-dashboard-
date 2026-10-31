const express = require('express');
const Order = require('../models/Order');
const DeliveryReport = require('../models/DeliveryReport');
const { requireAuth, requireDelivery } = require('../middleware/auth');
const router = express.Router();

router.use(requireAuth, requireDelivery);

router.get('/', async (req, res, next) => {
  try {
    const filter = { assignedDeliveryBoy: req.session.user.id };
    const orders = await Order.find(filter).sort({ updatedAt: -1 }).limit(100).lean();
    const reports = await DeliveryReport.find({ deliveryBoy: req.session.user.id }).sort({ createdAt: -1 }).limit(10).populate('order', 'orderNumber').lean();
    const stats = {
      assigned: orders.filter(o => ['READY_FOR_PICKUP', 'CONFIRMED', 'PREPARING'].includes(o.officialStatus)).length,
      active: orders.filter(o => o.officialStatus === 'OUT_FOR_DELIVERY').length,
      pending: reports.filter(r => r.verificationStatus === 'PENDING').length,
      completed: reports.filter(r => r.verificationStatus === 'APPROVED' && r.result === 'DELIVERED').length
    };
    res.render('delivery/dashboard', { orders, reports, stats, user: req.session.user, notice: req.query.notice || null });
  } catch (err) { next(err); }
});

router.post('/orders/:id/accept', async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, assignedDeliveryBoy: req.session.user.id, officialStatus: { $in: ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'] } });
    if (!order) return res.redirect('/delivery?notice=order-unavailable');
    order.acceptedAt = new Date();
    await order.save();
    res.redirect('/delivery?notice=accepted');
  } catch (err) { next(err); }
});

router.post('/orders/:id/reject', async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, assignedDeliveryBoy: req.session.user.id, officialStatus: { $ne: 'DELIVERED' } });
    if (!order) return res.redirect('/delivery?notice=order-unavailable');
    order.assignedDeliveryBoy = null;
    await order.save();
    res.redirect('/delivery?notice=assignment-released');
  } catch (err) { next(err); }
});

router.post('/orders/:id/pickup', async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, assignedDeliveryBoy: req.session.user.id, officialStatus: 'READY_FOR_PICKUP' });
    if (!order) return res.redirect('/delivery?notice=order-unavailable');
    order.pickedUpAt = new Date();
    order.officialStatus = 'OUT_FOR_DELIVERY';
    order.dispatchedAt = new Date();
    await order.save();
    res.redirect('/delivery?notice=picked-up');
  } catch (err) { next(err); }
});

router.post('/orders/:id/report', async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, assignedDeliveryBoy: req.session.user.id, officialStatus: 'OUT_FOR_DELIVERY' });
    if (!order) return res.redirect('/delivery?notice=order-unavailable');
    const result = req.body.result;
    if (!['DELIVERED', 'UNABLE_TO_DELIVER'].includes(result)) return res.redirect('/delivery?notice=invalid-report');
    const pending = await DeliveryReport.findOne({ order: order._id, verificationStatus: 'PENDING' });
    if (pending) return res.redirect('/delivery?notice=report-pending');
    await DeliveryReport.create({
      order: order._id,
      deliveryBoy: req.session.user.id,
      result,
      customerOtp: String(req.body.customerOtp || '').trim(),
      proofNote: String(req.body.proofNote || '').trim()
    });
    // Important: do not set officialStatus to DELIVERED here. Employee verification owns that transition.
    res.redirect('/delivery?notice=report-submitted');
  } catch (err) { next(err); }
});

router.get('/history', async (req, res, next) => {
  try {
    const reports = await DeliveryReport.find({ deliveryBoy: req.session.user.id }).sort({ createdAt: -1 }).populate('order').lean();
    res.render('delivery/history', { reports, user: req.session.user });
  } catch (err) { next(err); }
});

module.exports = router;