const User = require('../models/User');
const { generateToken } = require('../middleware/authMiddleware');
const https = require('https');

// Validate email using AbstractAPI
const validateEmailWithAPI = (email) => {
  return new Promise((resolve) => {
    const apiKey = process.env.EMAIL_VALIDATION_KEY;
    if (!apiKey) return resolve({ valid: true }); // skip if no key set

    const url = `https://emailvalidation.abstractapi.com/v1/?api_key=${apiKey}&email=${encodeURIComponent(email)}`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch {
          resolve({ valid: true }); // if parse fails, allow registration
        }
      });
    }).on('error', () => resolve({ valid: true })); // if API fails, allow registration
  });
};

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ message: 'All fields are required' });

    // ── Email Validation via AbstractAPI ─────────────────────
    const emailCheck = await validateEmailWithAPI(email);

    // Block invalid format
    if (emailCheck.is_valid_format && emailCheck.is_valid_format.value === false) {
      return res.status(400).json({ message: 'Please enter a valid email address format.' });
    }

    // Block disposable/temporary emails
    if (emailCheck.is_disposable_email && emailCheck.is_disposable_email.value === true) {
      return res.status(400).json({ message: 'Disposable/temporary email addresses are not allowed. Please use a real email.' });
    }

    // Block emails where MX records not found (domain doesn't exist)
    if (emailCheck.is_mx_found && emailCheck.is_mx_found.value === false) {
      return res.status(400).json({ message: 'This email domain does not exist. Please use a real email address.' });
    }

    // Block undeliverable emails
    if (emailCheck.deliverability === 'UNDELIVERABLE') {
      return res.status(400).json({ message: 'This email address is not deliverable. Please use a valid email.' });
    }
    // ─────────────────────────────────────────────────────────

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      if (existing.email === email.toLowerCase()) return res.status(409).json({ message: 'Email already registered' });
      return res.status(409).json({ message: 'Username already taken' });
    }

    const user = await User.create({ username, email, password });
    const token = generateToken(user._id);
    res.status(201).json({ message: 'Account created!', token, user: { _id: user._id, username: user.username, email: user.email, avatar: user.avatar, bio: user.bio, status: user.status } });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages[0] });
    }
    res.status(500).json({ message: 'Server error during registration' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });
    user.status = 'online';
    user.lastSeen = new Date();
    await user.save({ validateBeforeSave: false });
    const token = generateToken(user._id);
    res.json({ message: 'Login successful!', token, user: { _id: user._id, username: user.username, email: user.email, avatar: user.avatar, bio: user.bio, status: 'online' } });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login' });
  }
};

const getMe = async (req, res) => res.json({ user: req.user });

const logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { status: 'offline', lastSeen: new Date() });
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error during logout' });
  }
};

module.exports = { register, login, getMe, logout };
