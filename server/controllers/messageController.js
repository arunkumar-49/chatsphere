const Message = require('../models/Message');
const Channel = require('../models/Channel');
const Notification = require('../models/Notification');

const getMessages = async (req, res) => {
  try {
    const { channelId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const channel = await Channel.findOne({ _id: channelId, members: req.user._id });
    if (!channel) return res.status(403).json({ message: 'Access denied' });
    const messages = await Message.find({ channel: channelId, deletedAt: null })
      .populate('sender', 'username avatar status')
      .sort({ createdAt: -1 }).skip(skip).limit(limit);
    const total = await Message.countDocuments({ channel: channelId, deletedAt: null });
    res.json({ messages: messages.reverse(), page, totalPages: Math.ceil(total / limit), hasMore: skip + limit < total });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { content, replyTo } = req.body;
    const channel = await Channel.findOne({ _id: channelId, members: req.user._id });
    if (!channel) return res.status(403).json({ message: 'Access denied' });
    let type = 'text', fileUrl = '', fileName = '', fileSize = 0;
    if (req.file) {
      const imageTypes = ['image/jpeg','image/jpg','image/png','image/gif','image/webp'];
      type = imageTypes.includes(req.file.mimetype) ? 'image' : 'file';
      fileUrl = `/uploads/${req.file.filename}`;
      fileName = req.file.originalname;
      fileSize = req.file.size;
    }
    if (!content && !req.file) return res.status(400).json({ message: 'Message content or file required' });
    const message = await Message.create({ channel: channelId, sender: req.user._id, content: content || '', type, fileUrl, fileName, fileSize, readBy: [req.user._id], replyTo: replyTo || null });
    const populated = await message.populate('sender', 'username avatar status');
    await Channel.findByIdAndUpdate(channelId, { lastMessage: message._id, lastActivity: new Date() });
    const otherMembers = channel.members.filter(m => m.toString() !== req.user._id.toString());
    const notifications = otherMembers.map(memberId => ({ recipient: memberId, sender: req.user._id, type: 'message', message: message._id, channel: channelId, text: `${req.user.username}: ${content ? content.substring(0, 50) : '📎 File'}` }));
    if (notifications.length > 0) await Notification.insertMany(notifications);
    res.status(201).json({ message: populated });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send message' });
  }
};

const editMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (message.sender.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Can only edit own messages' });
    message.content = content; message.isEdited = true;
    await message.save();
    const populated = await message.populate('sender', 'username avatar status');
    res.json({ message: populated });
  } catch (error) {
    res.status(500).json({ message: 'Failed to edit message' });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (message.sender.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Can only delete own messages' });
    message.deletedAt = new Date();
    await message.save();
    res.json({ message: 'Message deleted', messageId: message._id });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete message' });
  }
};

const reactToMessage = async (req, res) => {
  try {
    const { emoji } = req.body;
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    const userId = req.user._id;
    const existing = message.reactions.find(r => r.emoji === emoji);
    if (existing) {
      const idx = existing.users.indexOf(userId);
      if (idx > -1) { existing.users.splice(idx, 1); if (existing.users.length === 0) message.reactions = message.reactions.filter(r => r.emoji !== emoji); }
      else existing.users.push(userId);
    } else {
      message.reactions.push({ emoji, users: [userId] });
    }
    await message.save();
    const populated = await message.populate('sender', 'username avatar status');
    res.json({ message: populated });
  } catch (error) {
    res.status(500).json({ message: 'Failed to react' });
  }
};

const markAsRead = async (req, res) => {
  try {
    await Message.updateMany({ channel: req.params.channelId, readBy: { $ne: req.user._id }, deletedAt: null }, { $addToSet: { readBy: req.user._id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark as read' });
  }
};

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id }).populate('sender', 'username avatar').populate('channel', 'name isGroup').sort({ createdAt: -1 }).limit(30);
    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get notifications' });
  }
};

const markNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark notifications as read' });
  }
};

module.exports = { getMessages, sendMessage, editMessage, deleteMessage, reactToMessage, markAsRead, getNotifications, markNotificationsRead };
