const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: ['message', 'mention', 'reaction', 'channel_invite'], required: true },
    message: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel' },
    text: { type: String, default: '' },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
