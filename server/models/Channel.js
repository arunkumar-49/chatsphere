const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 50 },
    description: { type: String, default: '', maxlength: 200 },
    isGroup: { type: Boolean, default: false },
    isPasswordProtected: { type: Boolean, default: false },
    password: { type: String },
    avatar: { type: String, default: '' },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    lastActivity: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Channel', channelSchema);
