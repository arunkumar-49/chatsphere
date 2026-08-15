import { useState } from 'react';
import Avatar from '../UI/Avatar';
import EmojiPicker from '../UI/EmojiPicker';
import useAuthStore from '../../store/authStore';
import useUIStore from '../../store/uiStore';
import useSocket from '../../hooks/useSocket';
const SERVER_URL = 'http://localhost:5000';
const formatTime = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};
export default function MessageBubble({ message, showAvatar, showMeta, channelId }) {
  const { user } = useAuthStore();
  const { setEditingMessage, setImagePreview } = useUIStore();
  const { reactMessage, deleteMessage } = useSocket();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const isOwn = message.sender?._id === user?._id || message.sender === user?._id;
  const isDeleted = !!message.deletedAt;
  const handleReact = (emoji) => {
    reactMessage(message._id, emoji);
    setShowEmojiPicker(false);
  };
  const handleDelete = () => {
    if (window.confirm('Delete this message?')) {
      deleteMessage(message._id);
    }
  };
  const handleEdit = () => {
    setEditingMessage({ _id: message._id, content: message.content });
  };
  const myReactions = message.reactions?.flatMap((r) =>
    r.users?.includes(user?._id) ? [r.emoji] : []
  ) || [];
  const fileUrl = message.fileUrl
    ? message.fileUrl.startsWith('http')
      ? message.fileUrl
      : `${SERVER_URL}${message.fileUrl}`
    : '';
  return (
    <div className={`message-row ${isOwn ? 'own' : ''}`}>
      {/* Avatar */}
      {showAvatar ? (
        <Avatar user={message.sender} size="sm" showStatus={false} />
      ) : (
        <div style={{ width: 28 }} />
      )}
      {/* Content */}
      <div className="message-content-wrap">
        {/* Sender name + time */}
        {showMeta && (
          <div className="message-meta">
            {!isOwn && (
              <span className="message-sender-name">
                {message.sender?.username || 'Unknown'}
              </span>
            )}
            <span className="message-time">{formatTime(message.createdAt)}</span>
            {message.isEdited && <span className="message-edited-badge">(edited)</span>}
          </div>
        )}
        {/* Bubble */}
        {isDeleted ? (
          <div className="message-bubble deleted">🗑️ Message was deleted</div>
        ) : message.type === 'image' ? (
          <img
            src={fileUrl}
            alt="shared image"
            className="message-image"
            onClick={() => setImagePreview(fileUrl)}
          />
        ) : message.type === 'file' ? (
          <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="message-file" download>
            <span className="message-file-icon">📎</span>
            <div className="message-file-info">
              <div className="message-file-name">{message.fileName || 'File'}</div>
              <div className="message-file-size">{formatFileSize(message.fileSize)} — Click to download</div>
            </div>
          </a>
        ) : (
          <div className="message-bubble">
            {message.content}
          </div>
        )}
        {/* Reactions */}
        {message.reactions?.length > 0 && (
          <div className="reactions-row">
            {message.reactions.map((r) => (
              r.users?.length > 0 && (
                <button
                  key={r.emoji}
                  className={`reaction-chip ${myReactions.includes(r.emoji) ? 'mine' : ''}`}
                  onClick={() => handleReact(r.emoji)}
                >
                  {r.emoji}
                  <span>{r.users.length}</span>
                </button>
              )
            ))}
          </div>
        )}
      </div>
      {/* Actions (hover) */}
      {!isDeleted && (
        <div className="message-actions">
          <button
            className="message-action-btn"
            title="React"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            😊
          </button>
          {isOwn && message.type === 'text' && (
            <button className="message-action-btn" title="Edit" onClick={handleEdit}>
              ✏️
            </button>
          )}
          {isOwn && (
            <button className="message-action-btn danger" title="Delete" onClick={handleDelete}>
              🗑️
            </button>
          )}
        </div>
      )}
      {/* Emoji Picker for reactions */}
      {showEmojiPicker && (
        <div style={{ position: 'absolute', zIndex: 50, top: -230, right: isOwn ? 'auto' : 0, left: isOwn ? 0 : 'auto' }}>
          <EmojiPicker onSelect={handleReact} />
          <div
            style={{ position: 'fixed', inset: 0, zIndex: -1 }}
            onClick={() => setShowEmojiPicker(false)}
          />
        </div>
      )}
    </div>
  );
}
