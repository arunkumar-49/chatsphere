const Channel = require('../models/Channel');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const getChannels = async (req, res) => {
  try {
    const channels = await Channel.find({ members: req.user._id })
      .populate('members', 'username email avatar status lastSeen')
      .populate('admins', 'username email avatar')
      .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'username avatar' } })
      .sort({ lastActivity: -1 });
    // Strip password hash before sending
    const safe = channels.map((c) => { const obj = c.toObject(); delete obj.password; return obj; });
    res.json({ channels: safe });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch channels' });
  }
};

const createChannel = async (req, res) => {
  try {
    const { name, description, members, password } = req.body;
    if (!name) return res.status(400).json({ message: 'Channel name is required' });
    const memberIds = [...new Set([req.user._id.toString(), ...(members || [])])];

    const channelData = {
      name,
      description,
      isGroup: true,
      members: memberIds,
      admins: [req.user._id],
      avatar: req.file ? `/uploads/${req.file.filename}` : '',
    };

    // If a password is provided, hash it
    if (password && password.trim()) {
      channelData.isPasswordProtected = true;
      channelData.password = await bcrypt.hash(password.trim(), 10);
    }

    const channel = await Channel.create(channelData);
    const populated = await channel.populate('members admins', 'username email avatar status');
    const obj = populated.toObject();
    delete obj.password;
    res.status(201).json({ channel: obj });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create channel' });
  }
};

const joinChannel = async (req, res) => {
  try {
    const { password } = req.body;
    const channel = await Channel.findById(req.params.id);
    if (!channel || !channel.isGroup) return res.status(404).json({ message: 'Channel not found' });

    // If already a member, just return the channel
    if (channel.members.map(String).includes(req.user._id.toString())) {
      const populated = await channel.populate('members admins', 'username email avatar status');
      const obj = populated.toObject();
      delete obj.password;
      return res.json({ channel: obj });
    }

    // Verify password if protected
    if (channel.isPasswordProtected) {
      if (!password) return res.status(403).json({ message: 'Password required to join this channel' });
      const match = await bcrypt.compare(password, channel.password);
      if (!match) return res.status(403).json({ message: 'Incorrect password' });
    }

    channel.members.push(req.user._id);
    await channel.save();
    const populated = await channel.populate('members admins', 'username email avatar status');
    const obj = populated.toObject();
    delete obj.password;
    res.json({ channel: obj });
  } catch (error) {
    res.status(500).json({ message: 'Failed to join channel' });
  }
};

const getPublicChannels = async (req, res) => {
  try {
    const channels = await Channel.find({ isGroup: true })
      .populate('members', 'username email avatar status lastSeen')
      .populate('admins', 'username email avatar')
      .sort({ lastActivity: -1 });
    const safe = channels.map((c) => {
      const obj = c.toObject();
      delete obj.password;
      obj.memberCount = obj.members.length;
      obj.isMember = obj.members.some((m) => m._id.toString() === req.user._id.toString());
      return obj;
    });
    res.json({ channels: safe });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch public channels' });
  }
};

const createOrGetDM = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'Target user ID required' });
    if (userId === req.user._id.toString()) return res.status(400).json({ message: 'Cannot DM yourself' });
    const targetUser = await User.findById(userId);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });
    let channel = await Channel.findOne({ isGroup: false, members: { $all: [req.user._id, userId], $size: 2 } }).populate('members', 'username email avatar status lastSeen');
    if (!channel) {
      channel = await Channel.create({ isGroup: false, members: [req.user._id, userId], name: '' });
      channel = await channel.populate('members', 'username email avatar status lastSeen');
    }
    res.json({ channel });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create DM' });
  }
};

const updateChannel = async (req, res) => {
  try {
    const { name, description } = req.body;
    const channel = await Channel.findById(req.params.id);
    if (!channel) return res.status(404).json({ message: 'Channel not found' });
    if (!channel.admins.includes(req.user._id)) return res.status(403).json({ message: 'Only admins can update' });
    if (name) channel.name = name;
    if (description !== undefined) channel.description = description;
    if (req.file) channel.avatar = `/uploads/${req.file.filename}`;
    await channel.save();
    const updated = await channel.populate('members admins', 'username email avatar status');
    const obj = updated.toObject();
    delete obj.password;
    res.json({ channel: obj });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update channel' });
  }
};

const addMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const channel = await Channel.findById(req.params.id);
    if (!channel || !channel.isGroup) return res.status(404).json({ message: 'Group channel not found' });
    if (!channel.admins.includes(req.user._id)) return res.status(403).json({ message: 'Only admins can add members' });
    if (channel.members.includes(userId)) return res.status(400).json({ message: 'User already a member' });
    channel.members.push(userId);
    await channel.save();
    const updated = await channel.populate('members admins', 'username email avatar status');
    const obj = updated.toObject();
    delete obj.password;
    res.json({ channel: obj });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add member' });
  }
};

const getChannel = async (req, res) => {
  try {
    const channel = await Channel.findOne({ _id: req.params.id, members: req.user._id }).populate('members admins', 'username email avatar status lastSeen');
    if (!channel) return res.status(404).json({ message: 'Channel not found' });
    const obj = channel.toObject();
    delete obj.password;
    res.json({ channel: obj });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get channel' });
  }
};

module.exports = { getChannels, createChannel, createOrGetDM, updateChannel, addMember, getChannel, joinChannel, getPublicChannels };
