require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');

const app = express();
// Render and other hosted platforms terminate HTTPS at a reverse proxy.
// Trust the platform proxy so express-session can set secure cookies correctly.
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: false, limit: '20kb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  name: 'goan.delivery.sid',
  secret: process.env.SESSION_SECRET || 'development-only-change-this-secret',
  resave: false,
  saveUninitialized: false,
  store: process.env.MONGODB_URI ? MongoStore.create({ mongoUrl: process.env.MONGODB_URI }) : undefined,
  cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: Number(process.env.SESSION_MAX_AGE_MS || 86400000) }
}));
app.use((req, res, next) => { res.locals.currentUser = req.session.user || null; next(); });
app.get('/', (req, res) => res.redirect(req.session.user ? '/delivery' : '/login'));
app.use(authRoutes);
app.use('/delivery', deliveryRoutes);
app.use((req, res) => res.status(404).render('error', { title: 'Page not found', message: 'The page you requested could not be found.' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', { title: 'Something went wrong', message: 'Please try again. If this continues, contact your administrator.' });
});

const port = Number(process.env.PORT || 3000);
connectDB().then(() => app.listen(port, () => console.log(`Delivery dashboard running on port ${port}`)))
  .catch(err => { console.error('Startup failed:', err.message); process.exit(1); });
