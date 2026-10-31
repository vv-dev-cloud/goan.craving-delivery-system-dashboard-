require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function main() {
  const [name, email, password] = process.argv.slice(2);
  if (!name || !email || !password || password.length < 10) {
    console.error('Usage: node scripts/create-delivery-user.js "Delivery Staff" staff@example.com "strong-password-10+chars"');
    process.exitCode = 1;
    return;
  }
  await mongoose.connect(process.env.MONGODB_URI);
  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({ name, email: email.toLowerCase(), passwordHash, role: 'delivery' });
  console.log('Delivery staff account created.');
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err.message);
  try { await mongoose.disconnect(); } catch (_) {}
  process.exitCode = 1;
});