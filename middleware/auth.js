function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  if (!req.session.user.isActive) {
    req.session.destroy(() => res.redirect('/login?notice=inactive'));
    return;
  }
  next();
}

function requireDelivery(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'delivery') {
    return res.status(403).render('error', { title: 'Access denied', message: 'This area is for delivery staff only.' });
  }
  next();
}

module.exports = { requireAuth, requireDelivery };