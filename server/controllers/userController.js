const User = require('../models/User');

const getProfile = async (req, res) => res.json({ user: req.user });

const updateProfile = async (req, res) => {
  try {
    const { username, bio } = req.body;
    const updateData = {};
    if (username) {
      const existing = await User.findOne({ username, _id: { $ne: req.user._id } });
      if (existing) return res.status(409).json({ message: 'Username already taken' });
      updateData.username = username;
    }
    if (bio !== undefined) updateData.bio = bio;
    if (req.file) updateData.avatar = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true, runValidators: true });
    res.json({ message: 'Profile updated', user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 1) return res.json({ users: [] });
    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } },
        { $or: [{ username: { $regex: q.trim(), $options: 'i' } }, { email: { $regex: q.trim(), $options: 'i' } }] },
      ],
    }).select('username email avatar status lastSeen').limit(20);
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Search failed' });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get user' });
  }
};

module.exports = { getProfile, updateProfile, searchUsers, getUserById };
