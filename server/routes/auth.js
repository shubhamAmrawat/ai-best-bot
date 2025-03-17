const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library'); // Added for Google OAuth

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID; // Ensure this is in your .env file
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Signup
router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ error: existingUser.username === username ? 'Username already exists' : 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, username });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body; // Changed to 'identifier' to handle username or email
  try {
    const user = await User.findOne({ $or: [{ username: identifier }, { email: identifier }] });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    // Only check password if user has one (i.e., not a Google user)
    if (user.password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
    } else {
      return res.status(400).json({ error: 'This account uses Google authentication' });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username: user.username });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Current User
router.get('/me', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('username -_id'); // Return only username
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ username: user.username }); // Match client structure
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Google Login
router.post('/google-login', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'No token provided' });

    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, sub: googleId, name } = payload;

    // Check if user exists, or create a new one
    let user = await User.findOne({ email });
    if (!user) {
      // If user doesn't exist, create a new user
      user = new User({
        username: `${name.split(" ")[0].toLowerCase()}${Math.floor(Math.random() * 1000)}`, // Unique username
        email,
        googleId,
      });
      await user.save();
    } else if (!user.googleId) {
      // If user exists but wasn't linked to Google, link the Google ID
      user.googleId = googleId;
      await user.save();
    } else if (user.googleId !== googleId) {
      return res.status(400).json({ error: 'This email is linked to another Google account' });
    }

    // Generate JWT token for the user
    const jwtToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token: jwtToken, username: user.username });
  } catch (error) {
    console.error('Google Login Error:', error.message);
    res.status(400).json({ error: 'Google login failed' });
  }
});

// Google Signup
router.post('/google-signup', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'No token provided' });

    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, sub: googleId, name } = payload;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Create a new user
    const user = new User({
      username: `${name.split(" ")[0].toLowerCase()}${Math.floor(Math.random() * 1000)}`, // Unique username
      email,
      googleId,
    });
    await user.save();

    // Generate JWT token for the user
    const jwtToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token: jwtToken, username: user.username });
  } catch (error) {
    console.error('Google Signup Error:', error.message);
    res.status(400).json({ error: 'Google signup failed' });
  }
});

module.exports = router;