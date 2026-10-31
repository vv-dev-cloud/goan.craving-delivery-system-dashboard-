const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();

router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/delivery');
  res.render('auth/login', { error: null });
});

router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !user.isActive || user.role !== 'delivery' || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).render('auth/login', { error: 'Email or password is incorrect.' });
    }
    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive };
      res.redirect('/delivery');
    });
  } catch (err) { next(err); }
});

router.post('/logout', (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});

module.exports = router;