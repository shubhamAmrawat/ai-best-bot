const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true }, // Email remains required
  password: { type: String }, // Made optional for Google users
  googleId: { type: String, unique: true }, // Added for Google OAuth
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);