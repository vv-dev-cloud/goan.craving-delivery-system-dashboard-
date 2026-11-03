const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const router = express.Router();
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: true, legacyHeaders: false });

router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/delivery');
  res.render('auth/login', { error: null });
});

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const agentId = String(req.body.agentId || '').trim().toUpperCase();
    const password = String(req.body.password || '');
    const user = await User.findOne({ agentId, role: 'delivery' }).select('+passwordHash');
    if (!user || !user.isActive || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).render('auth/login', { error: 'Delivery Agent ID or password is incorrect.' });
    }
    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.user = { id: user.id, name: user.name, email: user.email, agentId: user.agentId, role: user.role, isActive: user.isActive };
      req.session.save(saveErr => {
        if (saveErr) return next(saveErr);
        res.redirect('/delivery');
      });
    });
  } catch (err) { next(err); }
});

router.post('/logout', (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('goan.delivery.sid');
    res.redirect('/login');
  });
});

module.exports = router;
