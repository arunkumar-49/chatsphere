const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Channel = require('../models/Channel');
const Notification = require('../models/Notification');

const onlineUsers = new Map();


const socketHandler = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    console.log(`🟢 User connected: ${socket.user.username} (${userId})`);
    onlineUsers.set(userId, socket.id);
    await User.findByIdAndUpdate(userId, { status: 'online' });
    const channels = await Channel.find({ members: userId });
    channels.forEach((ch) => socket.join(ch._id.toString()));
    socket.broadcast.emit('user_status_change', { userId, status: 'online' });
    socket.emit('online_users', Array.from(onlineUsers.keys()));

    socket.on('join_channel', (channelId) => { socket.join(channelId); });
    socket.on('leave_channel', (channelId) => { socket.leave(channelId); });

    socket.on('send_message', async (data) => {
      try {
        const { channelId, content, type, fileUrl, fileName, fileSize, replyTo } = data;
        const channel = await Channel.findOne({ _id: channelId, members: userId });
        if (!channel) return;
        const message = await Message.create({ channel: channelId, sender: userId, content: content || '', type: type || 'text', fileUrl: fileUrl || '', fileName: fileName || '', fileSize: fileSize || 0, readBy: [userId], replyTo: replyTo || null });
        const populated = await message.populate('sender', 'username avatar status');
        await Channel.findByIdAndUpdate(channelId, { lastMessage: message._id, lastActivity: new Date() });
        io.to(channelId).emit('new_message', populated);
        const otherMembers = channel.members.filter((m) => m.toString() !== userId);
        for (const memberId of otherMembers) {
          const notification = await Notification.create({ recipient: memberId, sender: userId, type: 'message', message: message._id, channel: channelId, text: `${socket.user.username}: ${content ? content.substring(0, 60) : '📎 File'}` });
          const memberSocketId = onlineUsers.get(memberId.toString());
          if (memberSocketId) {
            const populatedNotif = await notification.populate('sender', 'username avatar');
            io.to(memberSocketId).emit('new_notification', populatedNotif);
          }
        }
      } catch (err) {
        console.error('Socket send_message error:', err);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('typing_start', ({ channelId }) => { socket.to(channelId).emit('user_typing', { userId, username: socket.user.username, channelId }); });
    socket.on('typing_stop', ({ channelId }) => { socket.to(channelId).emit('user_stopped_typing', { userId, channelId }); });

    socket.on('mark_read', async ({ channelId }) => {
      try {
        const updated = await Message.updateMany({ channel: channelId, readBy: { $ne: userId }, deletedAt: null }, { $addToSet: { readBy: userId } });
        if (updated.modifiedCount > 0) io.to(channelId).emit('messages_read', { channelId, userId });
      } catch (err) { console.error('Mark read error:', err); }
    });

    socket.on('react_message', async ({ messageId, emoji }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;
        const existingReaction = message.reactions.find((r) => r.emoji === emoji);
        if (existingReaction) {
          const idx = existingReaction.users.map(String).indexOf(userId);
          if (idx > -1) { existingReaction.users.splice(idx, 1); if (existingReaction.users.length === 0) message.reactions = message.reactions.filter((r) => r.emoji !== emoji); }
          else existingReaction.users.push(userId);
        } else { message.reactions.push({ emoji, users: [userId] }); }
        await message.save();
        const populated = await message.populate('sender', 'username avatar status');
        io.to(message.channel.toString()).emit('message_reaction', populated);
      } catch (err) { console.error('React error:', err); }
    });

    socket.on('edit_message', async ({ messageId, content }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message || message.sender.toString() !== userId) return;
        message.content = content; message.isEdited = true;
        await message.save();
        const populated = await message.populate('sender', 'username avatar status');
        io.to(message.channel.toString()).emit('message_edited', populated);
      } catch (err) { console.error('Edit message error:', err); }
    });

    socket.on('delete_message', async ({ messageId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message || message.sender.toString() !== userId) return;
        message.deletedAt = new Date();
        await message.save();
        io.to(message.channel.toString()).emit('message_deleted', { messageId });
      } catch (err) { console.error('Delete message error:', err); }
    });

    socket.on('disconnect', async () => {
      console.log(`🔴 User disconnected: ${socket.user.username}`);
      onlineUsers.delete(userId);
      await User.findByIdAndUpdate(userId, { status: 'offline', lastSeen: new Date() });
      io.emit('user_status_change', { userId, status: 'offline' });
    });
  });
};

module.exports = socketHandler;
